---
title: "Practical Guide: Building a Cell-Based Architecture on Azure with Terraform"
description: "As cloud applications scale globally, a single centralized stack introduces critical vulnerabilities. Cell-Based Architecture mitigates this by partitioning into isolated, self-contained units."
pubDate: "2026-04-21"
draft: false
tags:
  - azure
  - eventdriven
  - python
  - terraform
source:
  platform: dev.to
  id: 3522893
  url: https://dev.to/sertaoseracloud/practical-guide-building-a-cell-based-architecture-on-azure-with-terraform-and-python-1h04
  hash: ae9418c3b8fa5ebe0ca10a7ef962da39fd056b78cdf3269d04ea459d7663d49a
  synced_at: 2026-04-27
  translated_by: cli-model
canonical_url: https://sertaoseracloud.com/posts/practical-guide-building-a-cell-based-architecture-on-azure-with-terraform-and-python-1h04
manual_override: false
---

## 1. Introdução

À medida que as aplicações em nuvem escalam para atender públicos globais, depender de uma única pilha de infraestrutura centralizada introduz vulnerabilidades críticas. Uma falha localizada ou um vizinho ruidoso pode desencadear uma interrupção sistêmica. A Arquitetura Baseada em Células mitiga isso ao particionar o sistema em unidades isoladas, idênticas e autocontidas chamadas "células." Ao rotear inquilinos ou usuários específicos para células dedicadas, você restringe o raio de explosão de qualquer degradação estritamente àquela célula, preservando a disponibilidade do restante do sistema.

Ao final deste tutorial, você será capaz de projetar e provisionar uma arquitetura celular no Microsoft Azure. Utilizaremos o Azure Front Door como ponto de entrada global, o Azure Functions (Python) para roteamento dinâmico de tráfego e processamento, e o Azure Cosmos DB para gerenciamento de estado isolado. Dominar esse padrão no Azure não apenas reforça suas cargas de trabalho atuais, mas também consolida princípios fundamentais de multi-nuvem, pois os conceitos de roteamento desacoplado e isolamento de estado são diretamente transferíveis entre diferentes provedores de nuvem em um cenário corporativo unificado.

## 2. Pré-requisitos

Para executar as configurações e o código deste tutorial, verifique se você possui as seguintes ferramentas e níveis de acesso:

* Uma assinatura ativa do Microsoft Azure com permissões de Proprietário ou Colaborador para criar Grupos de Recursos, contas do Cosmos DB, Azure Functions e Azure Front Door.
* Terraform CLI (versão 1.0 ou superior) instalado localmente para provisionamento de Infraestrutura como Código (IaC).
* Python (versão 3.9 ou superior) instalado localmente, junto com o Azure Functions Core Tools para desenvolvimento e empacotamento local.
* Azure CLI instalado e autenticado (`az login`) em seu ambiente local.
* Compreensão fundamental de conceitos de particionamento e sintaxe HCL do Terraform.

## 3. Passo a Passo

Antes de mergulhar no código de infraestrutura, vamos visualizar o fluxo de execução. O diagrama de sequência abaixo detalha como uma solicitação global é interceptada, avaliada e encaminhada com segurança para uma pilha celular estritamente isolada no Azure.

![Diagrama de Sequência](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/b41axbpax2r7t18yxjvt.png)

### 3.1 Definindo o Blueprint da Célula (Módulo Terraform)

**O que fazer:** Crie um módulo Terraform reutilizável que represente uma única "Célula" isolada. Isso inclui uma Conta de Armazenamento dedicada, um Plano de Serviço de Aplicativo, uma Azure Function (Worker) e um banco de dados Cosmos DB.

**Por que fazer isso:** A regra principal da arquitetura celular é a consistência absoluta entre ambientes. Ao encapsular a infraestrutura em um módulo Terraform, você garante que cada célula gerada seja uma réplica exata, evitando desvio de configuração e simplificando a escala horizontal.

**Exemplo:**
Crie um diretório chamado `modules/cell` e adicione um arquivo `main.tf`.

```hcl
# modules/cell/main.tf
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "cell_id" { type = string }

resource "azurerm_cosmosdb_account" "cell_db" {
  name                = "cosmos-cell-${var.cell_id}"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "cell_sqldb" {
  name                = "app-state"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.cell_db.name
}

resource "azurerm_storage_account" "cell_storage" {
  name                     = "stcell${var.cell_id}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "cell_plan" {
  name                = "plan-cell-${var.cell_id}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption plan
}

resource "azurerm_linux_function_app" "cell_worker" {
  name                       = "func-worker-${var.cell_id}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  service_plan_id            = azurerm_service_plan.cell_plan.id
  storage_account_name       = azurerm_storage_account.cell_storage.name
  storage_account_access_key = azurerm_storage_account.cell_storage.primary_access_key

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "CELL_ID"            = var.cell_id
    "COSMOS_DB_ENDPOINT" = azurerm_cosmosdb_account.cell_db.endpoint
  }
}

output "function_default_hostname" {
  value = azurerm_linux_function_app.cell_worker.default_hostname
}
```

### 3.2 Criando Múltiplas Células

**O que fazer:** Na configuração raiz do Terraform, defina o grupo de recursos base e itere sobre uma coleção de identificadores para implantar múltiplas células simultaneamente.

**Por que fazer isso:** Isso traduz o módulo teórico em ambientes físicos isolados. O uso de um loop `for_each` permite escalar sem esforço de duas para cinquenta células apenas atualizando uma variável local, abstraindo a complexidade de gerenciar infraestruturas paralelas.

**Exemplo:**
No seu diretório raiz, crie o arquivo `main.tf`.

```hcl
# main.tf
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
  name     = "rg-cellular-architecture"
  location = "East US"
}

locals {
  cells = ["alpha", "beta"]
}

module "isolated_cells" {
  source   = "./modules/cell"
  for_each = toset(local.cells)

  cell_id             = each.key
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}
```

### 3.3 Desenvolvendo o Roteador de Célula em Python

**O que fazer:** Escreva o código da Função do Azure em Python que atuará como roteador de entrada global. Ele deve inspecionar solicitações HTTP recebidas, determinar o mapeamento apropriado de locatários e encaminhar a solicitação para a célula correta.

**Por que fazer isso:** O roteador abstrai a topologia interna do cliente. Aplicativos interagem com um único endpoint de API, sem saber que sua solicitação está sendo roteada para `cell-alpha` ou `cell-beta`. Esse mapeamento dinâmico permite realizar migrações ao vivo de locatários entre células para balancear carga sem tempo de inatividade.

**Exemplo:**
Crie o código Python para sua função de roteamento (`__init__.py` dentro da pasta da Função do Azure).

```python
import logging
import json
import os
import urllib.request
import azure.functions as func

# In production, fetch this from Cosmos DB (Tenant Registry)
CELL_ENDPOINTS = {
    "alpha": os.environ.get("CELL_ALPHA_URL", "https://func-worker-alpha.azurewebsites.net"),
    "beta": os.environ.get("CELL_BETA_URL", "https://func-worker-beta.azurewebsites.net")
}

def get_target_cell(tenant_id: str) -> str:
    # Mocking a Cosmos DB registry lookup
    # A real implementation would query the global metadata database
    if tenant_id.startswith("A"):
        return "alpha"
    return "beta"

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Global Router processing a request.')

    try:
        req_body = req.get_json()
        tenant_id = req_body.get('tenant_id')
        
        if not tenant_id:
            return func.HttpResponse(
                "Missing partition key: tenant_id", 
                status_code=400
            )

        target_cell = get_target_cell(tenant_id)
        target_url = f"{CELL_ENDPOINTS[target_cell]}/api/process"
        
        # Proxy the request to the isolated cell
        data = json.dumps(req_body).encode('utf-8')
        proxy_req = urllib.request.Request(
            target_url, 
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(proxy_req) as response:
            cell_response = response.read().decode('utf-8')

        return func.HttpResponse(
            json.dumps({
                "status": "success",
                "x_routed_to": target_cell,
                "data": json.loads(cell_response)
            }),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Routing error: {str(e)}")
        return func.HttpResponse("Internal Server Error", status_code=500)
```

### 3.4 Provisionando a Camada de Roteamento Global

**O que fazer:** Implante a Função do Azure de roteamento central e configure um perfil do Azure Front Door para ficar na frente dela.

**Por que fazer isso:** O Azure Front Door atua como um ponto de entrada global seguro e distribuído. Ele absorve ataques DDoS na borda, fornece recursos de WAF e garante que a Função de Roteador Global seja protegida contra exposição direta e não autenticada à internet.

**Exemplo:**
Adicione a infraestrutura de roteamento ao seu `main.tf` raiz.

```hcl
# Shared storage for the Global Router
resource "azurerm_storage_account" "router_storage" {
  name                     = "stglobalrouter"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "router_plan" {
  name                = "plan-global-router"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "global_router" {
  name                       = "func-global-router-gateway"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  service_plan_id            = azurerm_service_plan.router_plan.id
  storage_account_name       = azurerm_storage_account.router_storage.name
  storage_account_access_key = azurerm_storage_account.router_storage.primary_access_key

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    "CELL_ALPHA_URL" = "https://${module.isolated_cells[\"alpha\"].function_default_hostname}"
    "CELL_BETA_URL"  = "https://${module.isolated_cells[\"beta\"].function_default_hostname}"
  }
}
```

Execute `terraform init`, `terraform plan` e `terraform apply` para implantar toda a arquitetura multi-célula.

## 4. Solução de Problemas Comuns

A transição para uma arquitetura celular requer uma mudança na forma como você gerencia estado e tráfego. Aqui estão problemas comuns que você pode encontrar:

1. **Limitação de Cosmos DB (HTTP 429) em uma Célula Específica:**
   * **Problema:** Uma célula começa a rejeitar solicitações, enquanto outras operam normalmente. Isso geralmente indica um "vizinho ruidoso" – um locatário cuja carga de trabalho subiu repentinamente, esgotando as Unidades de Solicitação (RUs) provisionadas para o banco de dados dessa célula específica.
   * **Solução:** Verifique as métricas no Azure Monitor. Se um locatário tiver ultrapassado o tamanho da célula compartilhada, você deve executar uma migração ao vivo. Atualize o Registro Global de Locatários (Banco de Dados de Metadados) para apontar aquele `tenant_id` específico para uma célula dedicada recém-provisionada, redirecionando seu tráfego de forma transparente.

2. **Sobrecarga de Latência na Camada de Roteamento:**
   * **Problema:** As solicitações demoram significativamente mais porque precisam passar pelo Front Door, pela Função de Roteador e, finalmente, pela Função de Célula.
   * **Solução:** A lógica do roteador deve ser otimizada agressivamente. Implemente cache no nível do Roteador Global usando o Cache do Azure para Redis para que a função não precise consultar o Cosmos DB para o mapeamento de locatários em cada solicitação.

3. **Inicializações a Frio em Funções do Azure:**
   * **Problema:** A primeira solicitação para uma célula específica leva vários segundos para ser executada.
   * **Solução:** Como usamos o Plano de Consumo (`Y1`) para eficiência de custo neste tutorial, as inicializações a frio são esperadas. Para cargas de trabalho de produção, mude o Plano de Serviço de Aplicativo para Premium (`EP1` ou superior) para manter as instâncias pré-aquecidas, garantindo respostas consistentes com baixa latência.

## 5. Conclusão

Construir uma Arquitetura Baseada em Células no Azure transforma vulnerabilidades monolíticas em unidades gerenciáveis e contidas. Ao utilizar o Terraform, estabelecemos uma linha de base reprodutível para ambientes isolados e implementamos uma camada de roteamento Python para encaminhar tráfego dinamicamente.

Esse desacoplamento garante que picos massivos de tráfego ou implantações com problemas sejam restritos a domínios únicos. Ao amadurecer essa arquitetura, foque em automatizar o processo de "Migração de Locatários" — mover dados ativos entre instâncias do Cosmos DB sem tempo de inatividade — e padronizar seus módulos do Terraform para garantir que esse padrão possa ser adotado rapidamente em vários ambientes de nuvem.