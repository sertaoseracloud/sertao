Traduza o markdown abaixo para PT‑BR, preservando cabeçalhos H2/H3 e respeitando o glossário em .planning/glossary.json. Retorne apenas o markdown traduzido.

---

## 1. Introduction

A multicloud cell-based architecture represents the pinnacle of fault isolation and vendor neutrality. By distributing autonomous "cells" across different cloud provider, such as placing Cell Alpha in AWS and Cell Beta in Azure, you eliminate the risk of a single cloud provider's regional or global outage taking down your entire application. At the end of this tutorial, you will understand how to provision a unified control plane that intelligently routes tenant traffic to entirely isolated data planes residing in disparate cloud ecosystems.

This architecture is highly valuable for organizations with extreme availability requirements and strict regulatory compliance mandates. It prevents vendor lock-in by enforcing an agnostic ingress layer and identical compute/state contracts across clouds. Building this requires mature infrastructure as code practices and a deep understanding of decoupled domain boundaries.

## 2. Prerequisites

To execute this architectural pattern, you must have the following tools and access configured:

* Active accounts on both Amazon Web Services (AWS) and Microsoft Azure, with administrative credentials.
* Terraform (version 1.0+) installed locally, with both `hashicorp/aws` and `hashicorp/azurerm` providers authenticated.
* Python (version 3.11+) for writing the agnostic edge routing logic.
* A registered domain name and access to a neutral Edge DNS provider (e.g., Cloudflare) to act as the global entry point.
* Understanding of Domain-Driven Design (DDD) to ensure cell workloads are completely bounded and stateless.

## 3. Step-by-Step

A multicloud cellular architecture requires a strict separation between the "Control Plane" (which knows where tenants live) and the "Data Plane" (where the actual compute and storage happen). The sequence diagram below illustrates how an edge router evaluates the request and proxies it to the respective cloud provider.

![Sequence Diagram](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e2e2rek5unmrhr5kaj2m.png)

### 3.1 Configuring the Multicloud Terraform Environment

**What to do:** Create a root Terraform configuration that initializes both the AWS and Azure providers simultaneously.
**Why do it:** To manage a true multicloud infrastructure, your CI/CD pipeline must be able to orchestrate state across both environments from a single source of truth, ensuring that the infrastructure contracts remain identical.

**Example:**
Create your `main.tf` file to authenticate both providers:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "primary"
}

provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

variable "azure_subscription_id" {
  type        = string
  description = "Azure Subscription ID for the multicloud landing zone"
}
```

### 3.2 Provisioning the AWS Cell (Cell Alpha)

**What to do:** Deploy the AWS-specific data plane, consisting of an API Gateway, Lambda, and DynamoDB.
**Why do it:** This establishes your first isolated failure domain. The AWS cell acts as a self-contained unit capable of serving its assigned tenants without any dependency on the central control plane or the Azure cell.

**Example:**
Append the AWS cell definition to your `main.tf`:

```hcl
# AWS Cell Infrastructure (Simplified)
resource "aws_dynamodb_table" "aws_cell_state" {
  provider       = aws.primary
  name           = "multicloud-state-aws-alpha"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_lambda_function" "aws_cell_worker" {
  provider      = aws.primary
  filename      = "aws_worker.zip"
  function_name = "aws-worker-alpha"
  role          = aws_iam_role.aws_exec_role.arn
  handler       = "worker.handler"
  runtime       = "python3.11"
}

resource "aws_lambda_function_url" "aws_ingress" {
  provider           = aws.primary
  function_name      = aws_lambda_function.aws_cell_worker.function_name
  authorization_type = "NONE" # In production, restrict to Edge Router IPs/Tokens
}

output "aws_cell_endpoint" {
  value = aws_lambda_function_url.aws_ingress.function_url
}
```

### 3.3 Provisioning the Azure Cell (Cell Beta)

**What to do:** Deploy the Azure-specific data plane, consisting of an Azure Function and Cosmos DB.
**Why do it:** This creates the second failure domain in a completely separate physical network and control plane. If AWS experiences a major outage, the tenants assigned to the Azure cell experience zero degradation.

**Example:**
Append the Azure cell definition to your `main.tf`:

```hcl
# Azure Cell Infrastructure (Simplified)
resource "azurerm_resource_group" "az_cell_rg" {
  name     = "rg-multicloud-beta"
  location = "East US"
}

resource "azurerm_cosmosdb_account" "az_cell_db" {
  name                = "db-multicloud-az-beta"
  location            = azurerm_resource_group.az_cell_rg.location
  resource_group_name = azurerm_resource_group.az_cell_rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  geo_location {
    location          = azurerm_resource_group.az_cell_rg.location
    failover_priority = 0
  }
  consistency_policy {
    consistency_level = "Session"
  }
}

resource "azurerm_storage_account" "az_storage" {
  name                     = "stmulticloudbeta"
  resource_group_name      = azurerm_resource_group.az_cell_rg.name
  location                 = azurerm_resource_group.az_cell_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "az_plan" {
  name                = "plan-multicloud-beta"
  location            = azurerm_resource_group.az_cell_rg.location
  resource_group_name = azurerm_resource_group.az_cell_rg.name
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "az_cell_worker" {
  name                       = "func-az-worker-beta"
  location                   = azurerm_resource_group.az_cell_rg.location
  resource_group_name        = azurerm_resource_group.az_cell_rg.name
  service_plan_id            = azurerm_service_plan.az_plan.id
  storage_account_name       = azurerm_storage_account.az_storage.name
  storage_account_access_key = azurerm_storage_account.az_storage.primary_access_key

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }
}

output "az_cell_endpoint" {
  value = "https://${azurerm_linux_function_app.az_cell_worker.default_hostname}/api/process"
}
```

### 3.4 Developing the Agnostic Edge Router (Python)

**What to do:** Write the Python routing logic that will be deployed to a neutral edge layer (like Cloudflare Workers via Pyodide, or a dedicated edge Kubernetes cluster).
**Why do it:** You cannot host the global router inside AWS or Azure. If you host it in AWS and AWS goes down, your clients cannot reach the Azure cell because the router itself is dead. The routing layer must be cloud-agnostic.

**Example:**
Create `global_router.py`. This script intercepts the payload, queries the registry, and proxies the request across the internet backbone to the appropriate cloud.

```python
import json
import urllib.request
import os

# The global registry maps tenant IDs to specific cloud cell endpoints.
# In production, this data is fetched from a distributed edge database.
GLOBAL_REGISTRY = {
    "T-100": {
        "provider": "aws",
        "url": os.getenv("AWS_CELL_ENDPOINT", "https://aws-api-mock.com/process")
    },
    "T-200": {
        "provider": "azure",
        "url": os.getenv("AZ_CELL_ENDPOINT", "https://az-api-mock.com/api/process")
    }
}

def route_request(request_body: str) -> dict:
    try:
        payload = json.loads(request_body)
        tenant_id = payload.get("tenant_id")
        
        if not tenant_id:
            return {"status": 400, "body": "Missing tenant_id"}
        
        # 1. Lookup tenant location in the registry
        cell_info = GLOBAL_REGISTRY.get(tenant_id)
        if not cell_info:
            return {"status": 404, "body": "Tenant not allocated to any cell"}
        
        target_url = cell_info["url"]
        provider = cell_info["provider"]
        
        # 2. Proxy request to the specific cloud provider
        req = urllib.request.Request(
            target_url,
            data=request_body.encode('utf-8'),
            headers={'Content-Type': 'application/json', 'X-Multicloud-Auth': 'EdgeToken123'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            cell_response = response.read().decode('utf-8')
        
        # 3. Return payload to client with multicloud diagnostic headers
        return {
            "status": 200,
            "headers": {
                "X-Processed-By-Cloud": provider
            },
            "body": cell_response
        }
        
    except Exception as e:
        return {"status": 500, "body": f"Edge Routing Failure: {str(e)}"}
```

## 4. Common Troubleshooting

Operating a multicloud cellular architecture introduces extreme networking and data synchronization complexities. Be prepared to address the following challenges:

1. **State Fragmentation and Global Reporting:**
   - **Problem:** Your business intelligence team cannot run global queries because data is split between AWS DynamoDB and Azure Cosmos DB.
   - **Solution:** Do not attempt real-time federated queries across clouds. Implement a unified Data Lake (e.g., Snowflake or Databricks). Configure both the AWS Lambda and the Azure Function to asynchronously stream their state changes (Event Sourcing) into this central analytical repository.
2. **Cross-Cloud Latency at the Routing Layer:**
   - **Problem:** If the neutral Edge Router has to query a database in AWS to find out that a tenant belongs in Azure, the latency overhead becomes unacceptable.
   - **Solution:** The Tenant Registry must be cached at the edge. Utilize technologies like Cloudflare KV, Fastly Compute dictionaries, or Redis Enterprise Active-Active to ensure the routing metadata is geographically local to the Edge Router executing the Python script.
3. **CI/CD Configuration Drift:**
   - **Problem:** Over time, developers add features to the AWS cell but forget to implement the exact Azure equivalent, breaking the "identical cell" contract.
   - **Solution:** Enforce strict Hexagonal Architecture within your Python applications. The core domain logic must be a pure Python package shared across both clouds. The only differing code should be the specific I/O adapters (DynamoDB vs. Cosmos DB connectors).

## 5. Conclusion

By implementing a multicloud cell-based architecture, you have constructed the ultimate defense against cloud-provider lock-in and catastrophic outages. We used Terraform to simultaneously orchestrate isolated data planes in AWS and Azure, and developed an agnostic Python edge router to direct traffic based on tenant identity.

This model requires significant engineering maturity, but it guarantees that your infrastructure can scale infinitely horizontally while treating cloud providers as interchangeable utility commodities. As a next step, focus on automating the cross-cloud tenant migration process, allowing you to evacuate tenants from AWS to Azure in real-time if telemetry indicates a degradation in a specific provider's region.
