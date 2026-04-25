Your `OrderService` does six things when a customer clicks *Place Order*. It writes to the orders table, reserves inventory, charges the card, enqueues the shipping label, emails the receipt, and logs the analytics event. It does all of that inside one HTTP handler, in one transaction, on one box. When the payment gateway hiccups, the order fails. When the email provider rate-limits, the order fails. When inventory is slow, the order fails. The monolith tied six independent failure domains to one shared fate.

This article rebuilds that pipeline as an event-driven system on both Azure and AWS, and walks through where they genuinely differ - not where they superficially look the same. The reference scenario is e-commerce order processing with fan-out to Inventory, Payment, and Notification. Audience: intermediate-to-senior engineers who already read the vendor landing pages and want the parts those pages leave out.

## The pattern before the products

Before naming any cloud service, fix the shape. What you want is **publish/subscribe fan-out with durable per-consumer queues and per-consumer dead-letter queues**. The producer emits one logical event - `OrderPlaced` - to a topic. The topic delivers a copy to one durable queue per consumer. Each consumer drains its own queue at its own pace, retries on its own schedule, and when it gives up, the message lands in *its own* DLQ - not a shared one.

That last part matters. A shared DLQ means a poisoned inventory message blocks the payment team's on-call from seeing their own poison. One queue per consumer, one DLQ per consumer, one retry budget per consumer. The blast radius of any single bad message is exactly one bounded context.

![Fluxogram](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4u58flh3h0l5nf1oxzz6.png)

With the shape fixed, we can map it onto two clouds - one concern at a time.

## Side by side, one concern at a time

### Topic and subscription model

On **AWS** the topic and the queues are separate primitives. SNS publishes; SQS stores. You wire them together with a topic subscription and a queue policy. The queue holds your messages; the topic just fans them out. Two resource types per consumer.

On **Azure** Service Bus collapses that into one resource graph. A **namespace** contains a **topic**, and each consumer is a **subscription** on that topic. The subscription has a virtual queue behind it; you do not manage a separate queue resource. Fewer moving parts at the IaC layer, but less separation of concern - the topic and its subscribers share a lifecycle and a billing unit.

### Queue semantics and DLQ

Both brokers are **at-least-once**. Consumers will see duplicates. No marketing slide changes that.

AWS pairs each SQS queue with an explicit DLQ via a redrive policy. `maxReceiveCount` is the threshold; the main queue holds the in-flight message until the consumer explicitly deletes it, controlled by `visibility_timeout_seconds`. That visibility timeout must exceed P99 handler latency, with margin. Set it too low and the broker redelivers while the first handler is still working - you get two concurrent handlers racing, and idempotency becomes load-bearing in a way you probably did not test.

Azure Service Bus bakes the DLQ into every subscription as `$DeadLetterQueue`. `maxDeliveryCount` plays the same role as `maxReceiveCount`. Service Bus also dead-letters on two classes of failure SQS does not know about: **message TTL expiry** and **filter-evaluation exceptions**. Those two extra DLQ triggers are real operational wins - expired or malformed messages do not vanish into metrics.

One common claim worth pushing back on: *Service Bus gives exactly-once delivery*. It does not. What it gives is **duplicate detection within a bounded window** (up to seven days) on a per-`MessageId` basis. That is a broker-side helper, not a semantic guarantee. Consumers must still be idempotent. Same story on SQS FIFO and its five-minute content-based dedup window.

### Identity and data-plane auth

On AWS, consumers assume an IAM role from Lambda, ECS, or EKS. No access keys, no user credentials in config. The queue policy restricts senders to a specific topic ARN via an `aws:SourceArn` condition - without it, any SNS topic in your account can write to your queue. That is the classic confused-deputy footgun, and leaving the condition off is one of the most common rejection triggers in a real review.

On Azure, the equivalent of "no long-lived keys" is `disableLocalAuth: true` on the namespace, which kills SAS authentication entirely. All auth goes through AAD and Managed Identity. The right role is **Service Bus Data Receiver** scoped **per subscription**, not namespace-wide. Writers get **Service Bus Data Sender** on the topic. Scoping at the subscription level means a compromised notification consumer cannot read payment events - lateral movement is bounded by the RBAC scope.

### Ordering

Both platforms can do ordering. Neither should do ordering by default.

On AWS, ordering means FIFO queues keyed by `MessageGroupId`. The cap is 300 messages/sec (3,000 with batching) per queue. That is a hard ceiling, not a soft throttle.

On Azure, ordering means `SessionId` on messages and `requiresSession: true` on the subscription. Order is preserved per session. Throughput is fine on Standard; partitioning on Premium pushes it higher. The cost is that session-pinning serialises a subscription - a slow consumer on one session stalls messages in that session until the lock clears.

If the domain does not require strict order, do not enable it. FIFO is a business decision, not an architectural default.

## The trade-off matrix

This is the center of the article, not the closer. If you remember one thing, remember this table.

| Dimension | AWS SNS + SQS | Azure Service Bus (Standard / Premium) |
|---|---|---|
| **Primitive model** | Topic (SNS) fans out to separate SQS queues - two resource types per consumer | Single namespace → topic → subscription - one resource graph |
| **Cost model** | Pay-per-request on both SNS publishes and SQS requests; no idle cost | Standard: pay-per-million operations + namespace hourly. Premium: fixed messaging units (predictable floor ≈ $670/MU/month at time of writing; verify current SKU pricing, it drifts) |
| **Message ordering** | Standard: none. FIFO: strict ordering by `MessageGroupId`, capped at 300 msgs/s (3,000 with batching) | Standard: ordering within a session (`SessionId`). Premium: same, higher throughput, partitioning supported |
| **Delivery semantics** | At-least-once. FIFO adds content-based dedup in a 5-minute window | At-least-once. PeekLock + duplicate detection up to 7 days. Broker-side helper; still needs idempotent consumers |
| **Max message size** | 256 KB on both SNS and SQS. Workaround: claim-check via S3 + SQS Extended Client | Standard: 256 KB. Premium: 100 MB native |
| **DLQ handling** | Explicit SQS queue + redrive policy. `maxReceiveCount` threshold. Delivery-failure DLQ only | Implicit `$DeadLetterQueue` per subscription. `maxDeliveryCount` threshold. Also DLQs on TTL expiry and filter-eval errors |
| **Filtering** | SNS filter policies: JSON attribute match at subscription time | SQL filter and correlation filter per subscription - richer expression model |
| **Ops surface** | CloudWatch: `ApproximateNumberOfMessages`, `ApproximateAgeOfOldestMessage`. Alarm on DLQ depth > 0 | Azure Monitor: `ActiveMessages`, `DeadletteredMessages`. Alarm on `DeadletteredMessages > 0` |
| **Identity** | IAM roles assumed by Lambda/ECS/EKS; SSE-KMS | AAD + Managed Identity; `disableLocalAuth=true` kills SAS |
| **Network isolation** | VPC Endpoints (Interface for SNS, Interface/Gateway for SQS) | Private Endpoint (Premium SKU for full VNet integration) |
| **Throughput** | SNS: millions of msgs/s. SQS standard: effectively unlimited. SQS FIFO: 300–3,000 msgs/s per queue | Standard: ~2,000 msgs/s per namespace as a working guideline. Premium: scales with messaging units (~1,000 msgs/s per MU) |

**One-line heuristic:** If the workload demands > 256 KB messages, strong ordering at high throughput, or VNet isolation with ordering, Service Bus Premium earns its cost. Otherwise – massive fan-out, idempotent consumers, per-request billing – SNS + SQS wins. **Standard Service Bus is the baseline; Premium is an upgrade you justify, not a default.**

## The IaC - AWS

Production-grade Terraform. FinOps tags, SSE, redrive policies, and an `aws:SourceArn` condition on the queue policy. Keep all of it – each line carries a security or reliability property the cluster depends on.

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

## The IaC - Azure

Same scenario, same tags, same `maxDeliveryCount = 5`. Note `disableLocalAuth: true` on the namespace and per-subscription RBAC at the bottom.

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

One caveat on the API version: `2022-10-01-preview` is still labelled preview at the time of writing. If your platform team forbids preview API versions in production, pin to the latest stable GA release and re-test `disableLocalAuth` - its behaviour has shifted across API versions.

## Seven architectural constraints

Treat these as acceptance criteria for any EDA pipeline you ship on either cloud. They are a punch list, not a wish list.

1. **At-least-once is the default on both sides.** Exactly-once is a consumer property - idempotent handlers plus a dedup store - not a broker guarantee. Broker-side windows (SQS FIFO 5 min, Service Bus duplicate detection up to 7 days) narrow the problem; they do not eliminate it.
2. **Visibility timeout and lock duration must exceed P99 handler latency.** If the broker redelivers while the first handler is still working, you double-process. Measure P99 under load, add headroom, and alert when handler duration approaches the timeout.
3. **Ordering is a bet you pay for.** FIFO caps AWS throughput at 300–3,000 msgs/s; sessions serialise Azure subscriptions. Turn it on only when the domain demands ordering - never as a safety blanket.
4. **DLQs are not a graveyard.** They need alerts (`DLQ depth > 0` pages the on-call) and a documented replay procedure - SQS redrive or Service Bus `$DeadLetterQueue` receive-and-resubmit. A DLQ without a replay runbook is a silent leak.
5. **Large messages are an anti-pattern.** > 256 KB on AWS implies claim-check via S3. Premium Service Bus supports 100 MB, but transport cost and consumer memory pressure still argue for claim-check at that size.
6. **Tag every resource** with `project`, `environment`, `workload`, `costCenter`, `managedBy`. Without those tags, FinOps cannot attribute spend and the platform team cannot enforce lifecycle policies. The snippets above carry the full set; do not strip them.
7. **No SAS keys, no IAM user keys.** Managed Identity on Azure, IAM roles on AWS. `disableLocalAuth: true` on the Service Bus namespace, `aws:SourceArn` condition on every SQS queue policy. Anything else is a long-lived credential waiting to leak.

The choice between SNS/SQS and Service Bus is rarely binary. Start on Standard Service Bus or SNS + SQS. Move to Premium or FIFO only when a constraint above - size, ordering, isolation - forces you there.
