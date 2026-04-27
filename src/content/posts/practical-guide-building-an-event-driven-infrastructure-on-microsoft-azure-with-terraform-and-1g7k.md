---
title: "Practical Guide: Event-Driven Infrastructure on Azure with Terraform"
description: "Event-driven architectures decouple system components, replacing direct synchronous communication with a highly scalable publish-subscribe model."
pubDate: "2026-04-19"
draft: false
tags: ["azure","eventdriven","python","terraform"]
source:
  platform: dev.to
  id: 3522838
  url: "https://dev.to/sertaoseracloud/practical-guide-building-an-event-driven-infrastructure-on-microsoft-azure-with-terraform-and-1g7k"
  hash: "c399dc786d9c3905e437faff2614d69dac516ffbbc4726309d3864988e0a977d"
  synced_at: "2026-04-25"
  translated_by: "cli-model"
canonical_url: "https://sertaoseracloud.com/posts/practical-guide-building-an-event-driven-infrastructure-on-microsoft-azure-with-terraform-and-1g7k"
manual_override: false
---

## 1. Introdução

Arquiteturas orientadas a eventos desacoplam componentes do sistema, substituindo a comunicação síncrona direta por um modelo de publicação/assinatura altamente escalável. Ao final deste tutorial, você será capaz de provisionar uma infraestrutura completa baseada em eventos no Microsoft Azure. Essa configuração utiliza o Azure Event Grid como espinha dorsal de roteamento de eventos, o Azure Service Bus para enfileiramento confiável de mensagens e o Azure Functions para processamento computacional serverless.

Dominar essa topologia é um requisito estrutural para o design de software moderno. Isolar produtores de consumidores garante que falhas localizadas não cascateiem pelo sistema, permitindo a escala independente de microsserviços. Além disso, traduzir esses conceitos entre diferentes provedores de nuvem fortalece uma estratégia robusta de multicloud, permitindo mapear padrões arquiteturais (como Event Bus -> Fila -> Compute Serverless) perfeitamente em uma landing zone baseada no Azure.

## 2. Pré-requisitos

Para executar as configurações propostas neste guia, certifique-se de que possui os seguintes pré-requisitos estabelecidos:

* Uma conta ativa da Microsoft Azure com permissões para criar Grupos de Recursos, Tópicos do Event Grid, Namespaces do Service Bus e Function Apps.
* Terraform instalado localmente (versão 1.0 ou superior) para provisionamento de Infraestrutura como Código (IaC).
* Python (versão 3.9 ou superior) instalado localmente para desenvolver a lógica da função.
* A CLI do Azure (`az`) instalada e autenticada em seu ambiente local.
* Familiaridade com navegação em terminal e sintaxe HCL do Terraform.

## 3. Passo a passo

Antes de mergulhar no código, é crítico visualizar o ciclo de vida do evento. O diagrama de sequência abaixo mapeia o fluxo de informações através dos serviços Azure provisionados.

![Diagrama de sequência](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7kbcd6voyf2c8w8wq4tl.png)

### 3.1 Configurando o Provedor e Grupo de Recursos

**O que fazer:** Defina o provedor Azure Resource Manager (`azurerm`) no Terraform e crie um Grupo de Recursos fundamental para agrupar logicamente todos os ativos de infraestrutura.

**Por que fazer:** O Terraform requer definições de provedores para autenticar e interagir com a API específica da nuvem. O Grupo de Recursos é uma construção obrigatória do Azure que controla o ciclo de vida e o gerenciamento de acesso dos recursos que contém.

**Exemplo:**  
Crie um arquivo chamado `main.tf` e adicione a seguinte configuração:

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-event-driven-architecture"
  location = "East US"
}
```

### 3.2 Criando o Tópico do Event Grid

**O que fazer:** Provisionar um Tópico Personalizado (Custom Topic) no Azure Event Grid.

**Por que fazer:** Um Tópico Personalizado serve como o endpoint dedicado onde suas aplicações publicam eventos de negócios. Isolar eventos de negócios em um tópico personalizado evita misturar a lógica da aplicação com eventos de infraestrutura subjacentes do Azure.

**Exemplo:**  
Acrescente o seguinte bloco ao seu `main.tf`:

```hcl
resource "azurerm_eventgrid_topic" "custom_topic" {
  name                = "app-domain-events-topic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}
```

### 3.3 Provisionando o Namespace e Fila do Service Bus

**O que fazer:** Criar um Namespace do Service Bus e uma Fila específica dentro dele para absorver os eventos recebidos.

**Por que fazer:** Embora o Event Grid possa empurrar diretamente para uma Azure Function, o roteamento através de uma Fila do Service Bus introduz um buffer crítico. Isso garante alta disponibilidade, durabilidade de mensagens e evita sobrecarregar o serviço de computação downstream durante picos de tráfego.

**Exemplo:**  
Adicione as configurações do Service Bus:

```hcl
resource "azurerm_servicebus_namespace" "sb_namespace" {
  name                = "sb-event-driven-demo"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard"
}

resource "azurerm_servicebus_queue" "event_queue" {
  name         = "event-processing-queue"
  namespace_id = azurerm_servicebus_namespace.sb_namespace.id
}
```

### 3.4 Desenvolvendo a Azure Function em Python

**O que fazer:** Escrever o código Python usando o modelo de programação v2 das Azure Functions para processar mensagens que chegam na Fila do Service Bus.

**Por que fazer:** A função representa a lógica de negócio que reage ao evento. O modelo v2 utiliza decoradores, fornecendo uma maneira limpa e concisa de definir gatilhos e vinculações diretamente no código, tratando automaticamente a desserialização da mensagem.

**Exemplo:**  
Crie um arquivo chamado `function_app.py` no diretório do seu projeto:

```python
import logging
import json
import azure.functions as func

# Inicializa o App da Function
app = func.FunctionApp()

@app.service_bus_queue_trigger(
    arg_name="msg", 
    queue_name="event-processing-queue",
    connection="ServiceBusConnection"
)
def process_domain_event(msg: func.ServiceBusMessage):
    logger = logging.getLogger()
    logger.info("Initiating Service Bus event processing.")

    try:
        # Decodifica e carrega o corpo da mensagem
        msg_body = msg.get_body().decode('utf-8')
        event_payload = json.loads(msg_body)
        
        logger.info(f"Complete event payload: {json.dumps(event_payload, indent=2)}")
        
        # O esquema do Event Grid tipicamente encapsula dados em um campo 'data'
        data = event_payload.get('data', {})
        order_id = data.get('order_id')
        
        logger.info(f"Successfully processed business operation for order: {order_id}")

    except json.JSONDecodeError:
        logger.error("Failed to decode message payload as JSON.")
    except Exception as e:
        logger.error(f"Unexpected error during processing: {str(e)}")
```

### 3.5 Provisionando a Infraestrutura de Computação para a Function

**O que fazer:** Definir a Conta de Armazenamento, o Plano de Serviço (Consumo), e o App de Function Linux via Terraform, injetando as strings de conexão necessárias como variáveis de ambiente.

**Por que fazer:** Azure Functions requerem uma conta de armazenamento de suporte para gerenciamento de estado e um plano de execução para definir escala e preço. Injetar `ServiceBusConnection` vincula seguramente a camada de computação à camada de mensagens.

**Exemplo:**  
Adicione os recursos de computação ao seu `main.tf`:

```hcl
resource "azurerm_storage_account" "sa" {
  name                     = "saeventdrivendemo123" # Deve ser globalmente único
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "asp" {
  name                = "asp-event-driven"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "Y1" # Plano de Consumo Serverless
}

resource "azurerm_linux_function_app" "function_app" {
  name                       = "func-order-processor-app"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  service_plan_id            = azurerm_service_plan.asp.id
  storage_account_name       = azurerm_storage_account.sa.name
  storage_account_access_key = azurerm_storage_account.sa.primary_access_key

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "python"
    "ServiceBusConnection"     = azurerm_servicebus_namespace.sb_namespace.default_primary_connection_string
  }
}
```

### 3.6 Criando a Assinatura do Event Grid (Regra de Roteamento)

**O que fazer:** Configurar uma Assinatura de Evento que filtra eventos que chegam ao Tópico Personalizado e os roteia para a Fila do Service Bus.

**Por que fazer:** Filtragem avançada garante que apenas eventos relevantes alcancem a camada de computação, evitando execuções desnecessárias e reduzindo custos. Isso atua como o roteador inteligente na arquitetura.

**Exemplo:**  
Complete o arquivo `main.tf` com a assinatura de roteamento:

```hcl
resource "azurerm_eventgrid_event_subscription" "queue_subscription" {
  name  = "route-order-created"
  scope = azurerm_eventgrid_topic.custom_topic.id

  service_bus_queue_endpoint_id = azurerm_servicebus_queue.event_queue.id

  advanced_filter {
    string_in {
      key    = "data.detail-type"
      values = ["OrderCreated"]
    }
  }
}
```

Para implantar a infraestrutura, execute `terraform init`, `terraform plan` e `terraform apply`. Note que, enquanto o Terraform provisiona a infraestrutura, a implantação atual do código Python é tipicamente tratada via Azure Functions Core Tools (`func azure functionapp publish func-order-processor-app`) ou um pipeline de CI/CD como GitHub Actions.

## 4. Solução de Problemas Comuns

Implantar sistemas distribuídos pode introduzir desafios de integração. Aqui estão os problemas mais comuns e como resolvê-los:

1. **String de Conexão do Service Bus Ausente ou Inválida:**  
   Problema: A Azure Function falha ao disparar, e os logs mostram erros de vinculação.  
   Solução: Verifique as Configurações do Aplicativo (Application Settings) no Portal do Azure para o App de Function. Certifique-se de que `ServiceBusConnection` corresponde exatamente à string de conexão primária do Namespace do Service Bus e está grafada corretamente no decorador `app.service_bus_queue_trigger`.

2. **Incompatibilidade de Esquema do Event Grid:**  
   Problema: Eventos são publicados com sucesso no tópico, mas nunca chegam na Fila do Service Bus.  
   Solução: Inspecione a estrutura da carga útil. O Azure Event Grid requer um esquema específico (id, subject, data, eventType, etc.). Se você está filtrando por `data.detail-type` no Terraform, certifique-se de que seu JSON publicado contém explicitamente um objeto `data` com uma chave `detail-type` correspondente a `"OrderCreated"`.

3. **Conflitos de Nomeamento da Conta de Armazenamento:**  
   Problema: O Terraform falha durante a fase de `terraform apply` ao criar o `azurerm_storage_account`.  
   Solução: Nomes de contas de armazenamento no Azure devem ser globalmente únicos entre todos os clientes da Azure, puramente minúsculos, e ter entre 3 a 24 caracteres. Ajuste o atributo `name` no bloco do Terraform para uma string altamente única.

## 5. Conclusão

Este tutorial estabeleceu uma arquitetura resiliente e desacoplada nativa do Microsoft Azure. Ao utilizar o Terraform, provisionamos o Event Grid para roteamento inteligente de eventos, o Service Bus para enfileiramento robusto de mensagens e o Azure Functions para computação escalável.

Implementar esses padrões fornece um paralelo claro com outros ecossistemas de nuvem, reforçando uma fundação sólida para projetar arquiteturas celulares e estratégias de multicloud. Como próximo passo, explore a implementação de Filas de Mensagens Mortas (DLQ) dentro do Service Bus para tratar sistematicamente mensagens venenosas, garantindo que sua aplicação distribuída permaneça robusta mesmo diante de dados não processáveis.
