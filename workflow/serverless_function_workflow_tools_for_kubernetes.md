---
title: "Core Concepts"
summary: "Core Concepts is a ai & machine learning document covering Serverless/Function Workflows on Kubernetes and Core Concepts. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "agent"
  - "function"
  - "api"
  - "workflow"
  - "yaml"
  - "serverless"
  - "python"
  - "temporal"
category: "ai-ml"
categoryName: "AI & Machine Learning"
weight: 1
date: "2025-12-16"
draft: false
toc: true
---

# Serverless/Function Workflows on Kubernetes

This is about running **event-driven, scale-to-zero workloads** where functions are triggered by events and orchestrated into workflows. Great for cost efficiency and dynamic scaling.

## Core Concepts

**Traditional workflows**: Always-running services waiting for work
**Serverless workflows**: Functions that:
- Spin up on-demand
- Execute and terminate
- Scale to zero when idle
- Pay only for execution time

**Perfect for**: Bursty workloads, event-driven agents, API endpoints with variable traffic

## Main Players in K8s

### **Knative** ⭐ Industry Standard
```yaml
# What it is
K8s-native serverless platform (Google-backed, now CNCF)
```

**Architecture**:
- **Knative Serving**: HTTP-triggered functions, auto-scaling
- **Knative Eventing**: Event-driven workflows via pub/sub
- **License**: Apache 2.0

**Installation**:
```bash
# Install Knative Serving
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.12.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.12.0/serving-core.yaml

# Install Knative Eventing
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.12.0/eventing-crds.yaml
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.12.0/eventing-core.yaml
```

**Simple Function Example**:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: agent-function
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"  # Scale to zero
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: my-agent:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
```

**Workflow Example with Eventing**:
```yaml
# Event source (e.g., Kafka, SQS, webhooks)
apiVersion: sources.knative.dev/v1
kind: ApiServerSource
metadata:
  name: agent-trigger
spec:
  serviceAccountName: agent-sa
  mode: Resource
  resources:
  - apiVersion: v1
    kind: Event
  sink:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: agent-function

---
# Chain functions with sequences
apiVersion: flows.knative.dev/v1
kind: Sequence
metadata:
  name: agent-pipeline
spec:
  steps:
  - ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: gather-context
  - ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: run-llm
  - ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: format-response
  reply:
    ref:
      kind: Service
      apiVersion: serving.knative.dev/v1
      name: result-handler
```

**Strengths**:
- **Mature** - production-ready, widely adopted
- **Portable** - runs on any K8s (GKE, EKS, AKS, on-prem)
- **Scale-to-zero** - true pay-per-use
- **Event-driven** - comprehensive eventing framework
- **HTTP focus** - great for API endpoints

**Weaknesses**:
- Complex setup (needs Istio or similar for routing)
- Learning curve for eventing model
- Cold start latency (seconds)

**Best for**: HTTP APIs, webhook handlers, event-driven microservices

**Agent workflows**: Good for stateless agents triggered by events

---

### **OpenFaaS** ⭐ Developer Friendly
```yaml
# What it is
Simple functions-as-a-service on K8s
```

**Architecture**:
- **Gateway**: Routes requests to functions
- **Watchdog**: Wraps your code as HTTP service
- **Prometheus**: Built-in metrics
- **License**: MIT (CE), proprietary (Pro)

**Installation**:
```bash
# Using arkade (easiest)
arkade install openfaas

# Or Helm
helm repo add openfaas https://openfaas.github.io/faas-netes/
helm install openfaas openfaas/openfaas \
  --namespace openfaas \
  --set functionNamespace=openfaas-fn
```

**Function Example**:
```yaml
# stack.yml
version: 1.0
provider:
  name: openfaas
  gateway: http://gateway.openfaas:8080

functions:
  agent:
    lang: python3
    handler: ./agent
    image: myregistry/agent:latest
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    limits:
      memory: 512Mi
    requests:
      memory: 256Mi
    annotations:
      com.openfaas.scale.min: "0"
      com.openfaas.scale.max: "5"
```

**Python Handler**:
```python
# handler.py
import anthropic

def handle(req):
    """Handle function invocation"""
    client = anthropic.Anthropic()
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": req}]
    )
    
    return response.content[0].text
```

**Deploy**:
```bash
faas-cli build -f stack.yml
faas-cli push -f stack.yml
faas-cli deploy -f stack.yml
```

**Invoke**:
```bash
echo "Explain quantum computing" | faas-cli invoke agent
```

**Workflow Chaining**:
```bash
# Use function composition
faas-cli invoke gather-context | \
  faas-cli invoke process-llm | \
  faas-cli invoke format-output
```

**Strengths**:
- **Simple** - easiest to get started
- **CLI-driven** - great developer experience
- **Template library** - many languages supported
- **Async support** - queue-based invocation
- **Metrics** - Prometheus built-in

**Weaknesses**:
- Less sophisticated than Knative
- Simpler eventing model
- Smaller ecosystem

**Best for**: Quick function deployment, simple workflows, learning serverless

**Agent workflows**: Great for simple agent APIs, less ideal for complex orchestration

---

### **Fission**
```yaml
# What it is
Fast serverless functions on K8s
```

**Architecture**:
- **Executor**: Manages function pods
- **Router**: HTTP routing
- **Environments**: Pre-warmed containers
- **License**: Apache 2.0

**Installation**:
```bash
kubectl create -k "github.com/fission/fission/crds/v1?ref=v1.20.0"
helm install fission fission-charts/fission-all \
  --namespace fission
```

**Function Example**:
```bash
# Create environment (Python)
fission env create --name python --image fission/python-env

# Create function
fission function create \
  --name agent \
  --env python \
  --code agent.py \
  --minscale 0 \
  --maxscale 10
```

**Python Function**:
```python
# agent.py
from flask import request
import anthropic

def main():
    body = request.get_data(as_text=True)
    
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": body}]
    )
    
    return response.content[0].text
```

**Workflow Support**:
```yaml
# Fission Workflow CRD
apiVersion: fission.io/v1
kind: Workflow
metadata:
  name: agent-pipeline
spec:
  apiVersion: v1
  tasks:
    gather:
      functionRef: gather-context
    process:
      requires: [gather]
      functionRef: run-agent
    format:
      requires: [process]
      functionRef: format-result
```

**Strengths**:
- **Fast cold starts** - pool of warm containers
- **Workflow support** - built-in workflow engine
- **Triggers** - HTTP, time, message queues
- **Simplicity** - easier than Knative

**Weaknesses**:
- Smaller community than Knative/OpenFaaS
- Less active development recently
- Limited cloud integration

**Best for**: Fast cold-start requirements, workflow-heavy use cases

**Agent workflows**: Good - built-in workflow engine helps

---

### **Nuclio** (Data-Focused)
```yaml
# What it is
High-performance serverless for real-time/data workloads
```

**License**: Apache 2.0 (iguazio-backed)

**Installation**:
```bash
kubectl apply -f https://raw.githubusercontent.com/nuclio/nuclio/master/hack/k8s/resources/nuclio-rbac.yaml
kubectl apply -f https://raw.githubusercontent.com/nuclio/nuclio/master/hack/k8s/resources/nuclio.yaml
```

**Function Example**:
```yaml
# function.yaml
apiVersion: nuclio.io/v1
kind: NuclioFunction
metadata:
  name: agent-function
spec:
  runtime: python:3.9
  handler: main:handler
  minReplicas: 0
  maxReplicas: 10
  triggers:
    http:
      kind: http
      attributes:
        port: 8080
```

**Python Handler**:
```python
# main.py
def handler(context, event):
    import anthropic
    
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": event.body}]
    )
    
    return response.content[0].text
```

**Strengths**:
- **Performance** - designed for real-time
- **Data triggers** - Kafka, Kinesis, etc.
- **GPU support** - for ML workloads
- **Built-in data sources** - databases, streams

**Weaknesses**:
- Less general-purpose than others
- Smaller community
- Data/ML focus might be overkill

**Best for**: Real-time data processing, ML inference, streaming

**Agent workflows**: Good if agents process data streams

---

## Workflow Orchestration for Serverless

### **Knative Workflows**
Uses **Sequences** and **Parallels**:

```yaml
# Sequential workflow
apiVersion: flows.knative.dev/v1
kind: Sequence
metadata:
  name: agent-sequence
spec:
  steps:
    - ref:
        apiVersion: serving.knative.dev/v1
        kind: Service
        name: step1
    - ref:
        apiVersion: serving.knative.dev/v1
        kind: Service
        name: step2
  reply:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: result-handler
```

```yaml
# Parallel workflow
apiVersion: flows.knative.dev/v1
kind: Parallel
metadata:
  name: agent-parallel
spec:
  branches:
    - subscriber:
        ref:
          apiVersion: serving.knative.dev/v1
          kind: Service
          name: branch1
    - subscriber:
        ref:
          apiVersion: serving.knative.dev/v1
          kind: Service
          name: branch2
  reply:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: aggregator
```

---

### **Argo Events + Knative**
Combine Argo Events (event sources) with Knative (functions):

```yaml
# Event source
apiVersion: argoproj.io/v1alpha1
kind: EventSource
metadata:
  name: webhook
spec:
  webhook:
    agent-trigger:
      port: "12000"
      endpoint: /agent
      method: POST

---
# Sensor (workflow trigger)
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata:
  name: agent-sensor
spec:
  dependencies:
    - name: webhook-dep
      eventSourceName: webhook
      eventName: agent-trigger
  triggers:
    - template:
        name: knative-trigger
        knative:
          service:
            name: agent-function
```

---

### **Temporal + Serverless Functions**
Temporal orchestrates, functions execute:

```python
# Temporal workflow calling serverless functions
@workflow.defn
class AgentWorkflow:
    @workflow.run
    async def run(self, query: str):
        # Call Knative function via HTTP
        context = await workflow.execute_activity(
            call_knative_function,
            args=["gather-context", query]
        )
        
        result = await workflow.execute_activity(
            call_knative_function,
            args=["run-agent", context]
        )
        
        return result

@activity.defn
async def call_knative_function(func_name: str, payload: str):
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://{func_name}.default.svc.cluster.local",
            json={"data": payload}
        )
        return response.json()
```

---

## Agent Workflow Patterns

### **Pattern 1: Simple Request/Response Agent**
```yaml
# Single Knative function
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: chatbot
spec:
  template:
    spec:
      containers:
      - image: my-chatbot:latest
        env:
        - name: MODEL
          value: claude-sonnet-4-20250514
```

**Use case**: Chatbot API, simple Q&A

---

### **Pattern 2: Multi-Step Agent Pipeline**
```yaml
# Knative Sequence
apiVersion: flows.knative.dev/v1
kind: Sequence
metadata:
  name: research-agent
spec:
  steps:
  - ref:
      kind: Service
      name: web-search       # Search web
  - ref:
      kind: Service
      name: extract-info     # Extract key info
  - ref:
      kind: Service
      name: synthesize       # LLM synthesis
  - ref:
      kind: Service
      name: format-report    # Format output
```

**Use case**: Research agent, multi-step processing

---

### **Pattern 3: Parallel Agent Tasks**
```yaml
# Knative Parallel
apiVersion: flows.knative.dev/v1
kind: Parallel
metadata:
  name: multi-source-agent
spec:
  branches:
  - subscriber:
      ref:
        kind: Service
        name: search-web
  - subscriber:
      ref:
        kind: Service
        name: query-database
  - subscriber:
      ref:
        kind: Service
        name: call-api
  reply:
    ref:
      kind: Service
      name: aggregate-results  # Combine all sources
```

**Use case**: Agent gathering info from multiple sources simultaneously

---

### **Pattern 4: Event-Driven Agent**
```yaml
# Triggered by external events
apiVersion: sources.knative.dev/v1
kind: KafkaSource
metadata:
  name: support-tickets
spec:
  bootstrapServers:
  - kafka:9092
  topics:
  - support-tickets
  sink:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: ticket-agent  # Agent processes each ticket
```

**Use case**: Customer support agent triggered by new tickets

---

## Cost & Performance Comparison

| Platform | Cold Start | Warm Latency | Scale-to-Zero | Learning Curve |
|----------|------------|--------------|---------------|----------------|
| **Knative** | 1-3s | <50ms | ✅ Yes | Medium-High |
| **OpenFaaS** | 1-2s | <100ms | ✅ Yes | Low |
| **Fission** | 100-500ms | <50ms | ✅ Yes | Medium |
| **Nuclio** | <100ms | <20ms | ✅ Yes | Medium |

---

## When to Use Serverless Functions

### **Good Fit**:
✅ Bursty, unpredictable traffic
✅ Event-driven workloads
✅ Cost sensitivity (pay per use)
✅ Stateless operations
✅ API endpoints with variable load
✅ Webhooks, message processing

### **Poor Fit**:
❌ Consistent high traffic (always-on cheaper)
❌ Long-running tasks (cold start overhead)
❌ Stateful workflows (needs external state)
❌ Low-latency requirements (<100ms)
❌ Complex orchestration (better tools exist)

---

## Agent-Specific Recommendations

### **For AI Agents, Serverless Works When**:

**✅ Simple agents** (single LLM call, return response)
- Use: OpenFaaS or Knative Service
- Pattern: Direct HTTP invocation

**✅ Event-driven agents** (triggered by events)
- Use: Knative Eventing
- Pattern: Kafka/webhook → agent function

**✅ Parallel processing** (multiple agents working simultaneously)
- Use: Knative Parallel
- Pattern: Fan-out to multiple agents, aggregate results

**❌ Complex multi-step agents** (ReAct loops, planning)
- Problem: Cold starts kill latency
- Better: Temporal + always-on workers

**❌ Long-running agents** (tasks taking minutes/hours)
- Problem: Timeout limits, cost inefficiency
- Better: Argo Workflows or Temporal

---

## Hybrid Approach (Recommended)

Combine serverless + traditional orchestration:

```yaml
# Temporal workflow orchestrating Knative functions
Temporal Workflow (always-on, stateful)
  ↓
  Calls Knative Function (scales to zero)
    → Quick LLM operations
  ↓
  Calls Knative Function
    → Data processing
  ↓
  Returns to Temporal
```

**Benefits**:
- Temporal handles state/reliability
- Knative handles bursty compute
- Cost efficiency + reliability

---

## My Recommendation for You

Given your DevOps/K8s background:

### **Start with: Knative**
- Industry standard, portable
- Integrates with ArgoCD (GitOps)
- Mature, production-ready
- Good documentation

### **Quick Win: OpenFaaS**
- Easiest to learn serverless concepts
- Great for experimentation
- Simple deployment model

### **For Agents Specifically**:
```
Simple agent API → Knative Service (scale-to-zero)
Multi-step workflow → Temporal + Knative (hybrid)
Event-driven → Knative Eventing
High-performance → Nuclio (if data-heavy)
```

### **Avoid for Agents**:
- Pure serverless for complex ReAct loops (cold start kills UX)
- Serverless for long-running research tasks (use Argo/Temporal)

Want me to walk through deploying a specific agent pattern on Knative? I can show you the full setup including eventing and observability.
