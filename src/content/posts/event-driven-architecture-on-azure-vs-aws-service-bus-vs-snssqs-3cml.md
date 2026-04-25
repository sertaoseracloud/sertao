---
title: "Event-Driven Architecture on Azure vs AWS: Service Bus vs SNS/SQS"
description: "Your OrderService does six things when a customer clicks Place Order. It writes to the orders table, reserves inventory, charges the card, enqueues the shipping label, emails the receipt, and logs the analytics event."
pubDate: "2026-04-21"
draft: false
tags: ["aws","azure","cloud","eventdriven"]
source:
  platform: dev.to
  id: 3533320
  url: "https://dev.to/sertaoseracloud/event-driven-architecture-on-azure-vs-aws-service-bus-vs-snssqs-3cml"
  hash: "ed677de7970bd41598a9c91cd8e61cfa7f0a8ffaac86941a30d4a29c4814a8d2"
  synced_at: "2026-04-25"
  translated_by: "cli-model"
canonical_url: "https://sertaoseracloud.com/posts/event-driven-architecture-on-azure-vs-aws-service-bus-vs-snssqs-3cml"
manual_override: false
---

Seu `OrderService` faz seis coisas quando o cliente clica em *Place Order*. Ele escreve na tabela de pedidos, reserva estoque, cobra o cartão, enfileira a etiqueta de envio, envia o recibo por e‑mail e registra o evento de análise. Tudo isso ocorre dentro de um único handler HTTP, em uma transação, em um único servidor. Quando o gateway de pagamento hesita, o pedido falha. Quando o provedor de e‑mail limita a taxa, o pedido falha. Quando o estoque está lento, o pedido falha. O monólito amarrou seis domínios de falha independentes a um destino compartilhado.

Este artigo reconstrói esse pipeline como um sistema orientado a eventos tanto no Azure quanto na AWS, e detalha onde eles diferem genuinamente — não onde se parecem superficialmente. O cenário de referência é o processamento de pedidos de e‑commerce com fan‑out para Inventário, Pagamento e Notificação. Público‑alvo: engenheiros intermediários a sêniores que já leram as páginas de vendas dos fornecedores e querem as partes que essas páginas omitem.

## O padrão antes dos produtos

Antes de nomear qualquer serviço de nuvem, defina o formato. O que você quer é **publicar/assinar com fan‑out durável, com filas por consumidor e filas de dead‑letter por consumidor**. O produtor emite um evento lógico — `OrderPlaced` — para um tópico. O tópico entrega uma cópia para uma fila durável por consumidor. Cada consumidor esvazia sua própria fila no seu ritmo, tenta novamente em sua própria agenda e, quando desiste, a mensagem cai em *sua própria* DLQ — não em uma compartilhada.

Essa última parte importa. Uma DLQ compartilhada significa que uma mensagem envenenada de inventário bloqueia a equipe de pagamento de ver seu próprio veneno. Uma fila por consumidor, uma DLQ por consumidor, um orçamento de retry por consumidor. O raio de impacto de qualquer mensagem ruim é exatamente um contexto limitado.

![Fluxograma](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4u58flh3h0l5nf1oxzz6.png)

Com o formato definido, podemos mapeá‑lo para duas nuvens — uma preocupação de cada vez.

## Lado a lado, uma preocupação de cada vez

### Modelo de tópico e assinatura

Na **AWS** o tópico e as filas são primitivas separadas. SNS publica; SQS armazena. Você os conecta com uma assinatura de tópico e uma política de fila. A fila mantém suas mensagens; o tópico apenas as espalha. Dois tipos de recurso por consumidor.

No **Azure** o Service Bus colapsa isso em um único grafo de recursos. Um **namespace** contém um **tópico**, e cada consumidor é uma **assinatura** nesse tópico. A assinatura tem uma fila virtual atrás dela; você não gerencia um recurso de fila separado. Menos partes móveis na camada de IaC, mas menor separação de preocupações — o tópico e seus assinantes compartilham um ciclo de vida e uma unidade de faturamento.

### Semântica de fila e DLQ

Ambos os brokers são **at‑least‑once**. Consumidores verão duplicatas. Nenhum slide de marketing muda isso.

A AWS emparelha cada fila SQS com uma DLQ explícita via política de redrive. `maxReceiveCount` é o limiar; a fila principal mantém a mensagem em voo até que o consumidor a exclua explicitamente, controlada por `visibility_timeout_seconds`. Esse timeout de visibilidade deve exceder a latência P99 do handler, com margem. Defina‑o muito baixo e o broker redistribui enquanto o primeiro handler ainda está trabalhando — você obtém dois handlers concorrentes correndo, e a idempotência torna‑se essencial de uma forma que você provavelmente não testou.

O Azure Service Bus incorpora a DLQ em cada assinatura como `$DeadLetterQueue`. `maxDeliveryCount` desempenha o mesmo papel que `maxReceiveCount`. O Service Bus também envia para dead‑letter em duas classes de falha que o SQS não conhece: **expiração de TTL da mensagem** e **exceções de avaliação de filtro**. Esses dois gatilhos extra de DLQ são vitórias operacionais reais — mensagens expiradas ou malformadas não desaparecem nas métricas.

Uma afirmação comum que vale a pena reconsiderar: *Service Bus oferece entrega exactly‑once*. Não oferece. O que ele oferece é **detecção de duplicatas dentro de uma janela limitada** (até sete dias) com base em `MessageId` por mensagem. Isso é uma ajuda do lado do broker, não uma garantia semântica. Consumidores ainda devem ser idempotentes. Mesma história no SQS FIFO e sua janela de dedup baseada em conteúdo de cinco minutos.

### Identidade e auth do plano de dados

Na AWS, consumidores assumem uma função IAM do Lambda, ECS ou EKS. Sem chaves de acesso, sem credenciais de usuário na configuração. A política de fila restringe remetentes a um ARN de tópico específico via uma condição `aws:SourceArn` — sem isso, qualquer tópico SNS na sua conta pode escrever na sua fila. Essa é a clássica armadilha de confused‑deputy, e deixar a condição desligada é um dos gatilhos de rejeição mais comuns em uma revisão real.

No Azure, o equivalente a "sem chaves de longa duração" é `disableLocalAuth: true` no namespace, o que elimina totalmente a autenticação SAS. Toda a autenticação passa pelo AAD e Identidade Gerenciada. A função correta é **Service Bus Data Receiver** com escopo **por assinatura**, não em todo o namespace. Escritores obtêm **Service Bus Data Sender** no tópico. Escopar no nível de assinatura significa que um consumidor de notificação comprometido não pode ler eventos de pagamento — o movimento lateral é limitado pelo escopo RBAC.

### Ordenação

Ambas as plataformas podem fazer ordenação. Nenhuma deve fazer ordenação por padrão.

Na AWS, ordenação significa filas FIFO chaveadas por `MessageGroupId`. O limite é 300 mensagens/seg (3.000 com batching) por fila. Esse é um teto rígido, não um limitador suave.

No Azure, ordenação significa `SessionId` nas mensagens e `requiresSession: true` na assinatura. A ordem é preservada por sessão. O throughput é bom no Standard; o particionamento no Premium empurra‑o mais alto. O custo é que o pinamento de sessão serializa uma assinatura — um consumidor lento em uma sessão paralisa mensagens nessa sessão até que o bloqueio seja liberado.

Se o domínio não exige ordem estrita, não a habilite. FIFO é uma decisão de negócios, não um padrão arquitetural.

## A matriz de trade‑offs

Este é o centro do artigo, não o fechamento. Se você lembrar de uma coisa, lembre‑se desta tabela.

| Dimensão | AWS SNS + SQS | Azure Service Bus (Standard / Premium) |
|---|---|---|
| **Modelo primitivo** | Tópico (SNS) espalha para filas SQS separadas — dois tipos de recurso por consumidor | Único namespace → tópico → assinatura — um único grafo de recursos |
| **Modelo de custo** | Pagamento por requisição tanto em publicações SNS quanto em requisições SQS; sem custo ocioso | Standard: pagamento por milhão de operações + hora de namespace. Premium: unidades de mensagens fixas (piso previsível ≈ $670/MU/mês no momento da escrita; verifique o preço atual de SKU, ele deriva) |
| **Ordenação de mensagens** | Standard: nenhuma. FIFO: ordenação estrita por `MessageGroupId`, limitada a 300 msgs/s (3.000 com batching) | Standard: ordenação dentro de uma sessão (`SessionId`). Premium: mesmo, maior throughput, suporte a particionamento |
| **Semântica de entrega** | At‑least‑once. FIFO adiciona dedup baseada em conteúdo em uma janela de 5 minutos | At‑least‑once. PeekLock + detecção de duplicatas até 7 dias. Ajuda do lado do broker; ainda exige consumidores idempotentes |
| **Tamanho máximo de mensagem** | 256 KB tanto no SNS quanto no SQS. Solução alternativa: claim‑check via S3 + SQS Extended Client | Standard: 256 KB. Premium: 100 MB nativo |
| **Tratamento de DLQ** | Fila SQS explícita + política de redrive. Limiar `maxReceiveCount`. DLQ apenas para falhas de entrega | `$DeadLetterQueue` implícita por assinatura. Limiar `maxDeliveryCount`. Também DLQs em expiração de TTL e erros de avaliação de filtro |
| **Filtragem** | Políticas de filtro SNS: correspondência de atributos JSON no momento da assinatura | Filtro SQL e filtro de correlação por assinatura — modelo de expressão mais rico |
| **Superfície de ops** | CloudWatch: `ApproximateNumberOfMessages`, `ApproximateAgeOfOldestMessage`. Alarme em profundidade de DLQ > 0 | Azure Monitor: `ActiveMessages`, `DeadletteredMessages`. Alarme em `DeadletteredMessages > 0` |
| **Identidade** | Funções IAM assumidas por Lambda/ECS/EKS; SSE‑KMS | AAD + Identidade Gerenciada; `disableLocalAuth=true` elimina SAS |
| **Isolamento de rede** | VPC Endpoints (Interface para SNS, Interface/Gateway para SQS) | Private Endpoint (SKU Premium para integração VNet completa) |
| **Throughput** | SNS: milhões de msgs/s. SQS standard: efetivamente ilimitado. SQS FIFO: 300–3.000 msgs/s por fila | Standard: ~2.000 msgs/s por namespace como diretriz de trabalho. Premium: escala com unidades de mensagens (~1.000 msgs/s por MU) |

**Heurística de uma linha:** Se a carga de trabalho exige mensagens > 256 KB, ordenação forte com alto throughput, ou isolamento VNet com ordenação, o Service Bus Premium justifica seu custo. Caso contrário — fan‑out massivo, consumidores idempotentes, faturamento por requisição — SNS + SQS vence. **O Service Bus Standard é a linha de base; o Premium é um upgrade que você justifica, não um padrão.**

## O IaC — AWS

Terraform de nível de produção. Tags de FinOps, SSE, políticas de redrive e uma condição `aws:SourceArn` na política de fila. Mantenha tudo isso — cada linha carrega uma propriedade de segurança ou confiabilidade da qual o cluster depende.

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

variable "project"        { type = string }
variable "environment"    { type = string }               # dev | stg | prd
variable "aws_region"     { type = string  default = "us-east-1" }
variable "consumers" {
  description = "Logical consumers that subscribe to the OrderPlaced topic."
  type        = set(string)
  default     = ["inventory", "payment", "notification"]
}
variable "max_receive_count" { type = number default = 5 } # redrive threshold

locals {
  name_prefix = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    Workload    = "eda-orders"
    CostCenter  = "platform-events"
    ManagedBy   = "terraform"
  }
}

# --- Topic ----------------------------------------------------------------
resource "aws_sns_topic" "orders_placed" {
  name              = "${local.name_prefix}-orders-placed"
  kms_master_key_id = "alias/aws/sns"          # SSE at rest with AWS-managed CMK; swap to customer CMK for stricter tenants
  tags              = local.tags
}

# --- Queues + DLQs per consumer ------------------------------------------
resource "aws_sqs_queue" "dlq" {
  for_each                  = var.consumers
  name                      = "${local.name_prefix}-${each.key}-dlq"
  message_retention_seconds = 1209600            # 14 days - max allowed, buys ops time
  kms_master_key_id         = "alias/aws/sqs"
  tags = merge(local.tags, { Role = "dlq", Consumer = each.key })
}

resource "aws_sqs_queue" "main" {
  for_each                  = var.consumers
  name                      = "${local.name_prefix}-${each.key}"
  visibility_timeout_seconds = 60                 # must exceed consumer max processing time
  message_retention_seconds = 345600             # 4 days
  receive_wait_time_seconds = 20                 # long polling - reduces empty-receive cost
  kms_master_key_id         = "alias/aws/sqs"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = var.max_receive_count
  })
  tags = merge(local.tags, { Role = "main", Consumer = each.key })
}

# --- Allow SNS to write to SQS -------------------------------------------
data "aws_iam_policy_document" "sns_to_sqs" {
  for_each = var.consumers
  statement {
    sid     = "AllowSNSDeliver"
    effect  = "Allow"
    actions = ["sqs:SendMessage"]
    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
    resources = [aws_sqs_queue.main[each.key].arn]
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.orders_placed.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "main" {
  for_each  = var.consumers
  queue_url = aws_sqs_queue.main[each.key].id
  policy    = data.aws_iam_policy_document.sns_to_sqs[each.key].json
}

resource "aws_sns_topic_subscription" "consumer" {
  for_each             = var.consumers
  topic_arn            = aws_sns_topic.orders_placed.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.main[each.key].arn
  raw_message_delivery = true                     # consumers parse the raw event, not the SNS envelope
}

# --- Consumer IAM role template (least-privilege) ------------------------
data "aws_iam_policy_document" "consumer_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "consumer" {
  for_each           = var.consumers
  name               = "${local.name_prefix}-${each.key}-consumer"
  assume_role_policy = data.aws_iam_policy_document.consumer_assume.json
  tags               = merge(local.tags, { Consumer = each.key })
}

data "aws_iam_policy_document" "consumer_sqs" {
  for_each = var.consumers
  statement {
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility",
    ]
    resources = [aws_sqs_queue.main[each.key].arn]
  }
}

resource "aws_iam_role_policy" "consumer_sqs" {
  for_each = var.consumers
  role     = aws_iam_role.consumer[each.key].id
  policy   = data.aws_iam_policy_document.consumer_sqs[each.key].json
}

output "topic_arn" { value = aws_sns_topic.orders_placed.arn }
output "queues"    { value = { for k, q in aws_sqs_queue.main : k => q.arn } }
output "dlqs"      { value = { for k, q in aws_sqs_queue.dlq  : k => q.arn } }
```

## O IaC — Azure

Mesmo cenário, mesmas tags, mesmo `maxDeliveryCount = 5`. Note `disableLocalAuth: true` no namespace e RBAC por assinatura no final.

```bicep
// Deployment scope: resourceGroup
targetScope = 'resourceGroup'

@description('Project short code, e.g. osecloud')
param project string

@allowed([ 'dev', 'stg', 'prd' ])
param environment string

@description('Azure region.')
param location string = resourceGroup().location

@description('Logical consumers that subscribe to the OrderPlaced topic.')
param consumers array = [ 'inventory', 'payment', 'notification' ]

@description('Consumer identity object IDs (managed identities that will receive Data Receiver role). Key must match a name in `consumers`.')
param consumerPrincipalIds object = {}

@description('Service Bus SKU. Use Premium when you need ordering at scale, VNet integration, or >1MB messages.')
@allowed([ 'Standard', 'Premium' ])
param skuName string = 'Standard'

var namePrefix = toLower('${project}-${environment}')
var tags = {
  project:     project
  environment: environment
  workload:    'eda-orders'
  costCenter:  'platform-events'
  managedBy:   'bicep'
}

// --- Namespace ------------------------------------------------------------
resource sbNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name:     '${namePrefix}-sb'
  location: location
  sku: {
    name: skuName
    tier: skuName
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled' // set to 'Disabled' + private endpoint in prd
    disableLocalAuth: true         // force AAD/Managed Identity - no SAS keys
  }
  tags: tags
}

// --- Topic ----------------------------------------------------------------
resource topic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: sbNamespace
  name: 'orders-placed'
  properties: {
    defaultMessageTimeToLive: 'P14D'
    enableBatchedOperations: true
    supportOrdering: true          // preserves order within a session (partition) - only honoured with session-enabled subscriptions
  }
}

// --- Subscriptions + DLQ (DLQ is implicit per subscription) --------------
resource subs 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = [for name in consumers: {
  parent: topic
  name:   '${name}-sub'
  properties: {
    deadLetteringOnMessageExpiration:    true
    deadLetteringOnFilterEvaluationExceptions: true
    maxDeliveryCount: 5             // redrive threshold → moves to $DeadLetterQueue
    lockDuration:     'PT1M'        // matches visibility-timeout in AWS terms
    defaultMessageTimeToLive: 'P4D'
    requiresSession: false          // set true for FIFO-per-session guarantees
  }
}]

// --- RBAC: Azure Service Bus Data Receiver on each subscription ----------
var dataReceiverRoleId = '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0' // Service Bus Data Receiver

resource rbacReceiver 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (name, i) in consumers: if (contains(consumerPrincipalIds, name)) {
  name:  guid(subs[i].id, consumerPrincipalIds[name], dataReceiverRoleId)
  scope: subs[i]
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', dataReceiverRoleId)
    principalId:      consumerPrincipalIds[name]
    principalType:    'ServicePrincipal'
  }
}]

output namespaceId       string = sbNamespace.id
output topicId           string = topic.id
output subscriptionNames array  = [for (name, i) in consumers: subs[i].name]
```

Um aviso sobre a versão da API: `2022-10-01-preview` ainda é rotulada como preview no momento da escrita. Se sua equipe de plataforma proibe versões de API em preview em produção, fixe na última versão GA estável e re‑teste `disableLocalAuth` — seu comportamento mudou entre versões da API.

## Sete restrições arquiteturais

Trate estas como critérios de aceitação para qualquer pipeline EDA que você entregar em qualquer nuvem. Elas são uma lista de verificação, não uma lista de desejos.

1. **At‑least‑once é o padrão em ambos os lados.** Exactly‑once é uma propriedade do consumidor — handlers idempotentes mais um armazenamento de dedup — não uma garantia do broker. Janelas do lado do broker (SQS FIFO 5 min, detecção de duplicatas do Service Bus até 7 dias) estreitam o problema; elas não o eliminam.
2. **Timeout de visibilidade e duração de bloqueio devem exceder a latência P99 do handler.** Se o broker redistribuir enquanto o primeiro handler ainda está trabalhando, você processa em duplicidade. Meça P99 sob carga, adicione margem e alerta quando a duração do handler se aproximar do timeout.
3. **Ordenação é uma aposta que você paga.** FIFO limita o throughput da AWS a 300–3.000 msgs/s; sessões serializam assinaturas do Azure. Habilite‑a apenas quando o domínio exigir ordenação — nunca como um cobertor de segurança.
4. **DLQs não são um cemitério.** Elas precisam de alertas (`profundidade de DLQ > 0` pagina o plantonista) e um procedimento de replay documentado — redrive do SQS ou recebimento e reenvio do `$DeadLetterQueue` do Service Bus. Uma DLQ sem um runbook de replay é um vazamento silencioso.
5. **Mensagens grandes são um antipadrão.** > 256 KB na AWS implica claim‑check via S3. O Service Bus Premium suporta 100 MB, mas custo de transporte e pressão de memória do consumidor ainda argumentam a favor de claim‑check nesse tamanho.
6. **Marque cada recurso** com `project`, `environment`, `workload`, `costCenter`, `managedBy`. Sem essas tags, FinOps não pode atribuir gastos e a equipe de plataforma não pode impor políticas de ciclo de vida. Os snippets acima carregam o conjunto completo; não os remova.
7. **Sem chaves SAS, sem chaves de usuário IAM.** Identidade Gerenciada no Azure, funções IAM na AWS. `disableLocalAuth: true` no namespace do Service Bus, condição `aws:SourceArn` em cada política de fila SQS. Qualquer outra coisa é uma credencial de longa duração esperando para vazar.

A escolha entre SNS/SQS e Service Bus raramente é binária. Comece no Service Bus Standard ou SNS + SQS. Mova para Premium ou FIFO apenas quando uma restrição acima — tamanho, ordenação, isolamento — forçar você para lá.
