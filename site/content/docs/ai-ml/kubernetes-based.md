---
title: "Open Source Workflow Orchestration on Kubernetes"
summary: "Open Source Workflow Orchestration on Kubernetes is a ai & machine learning document covering Open Source Workflow Orchestration on Kubernetes and Categories of Workflow Tools. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "workflow"
  - "agent"
  - "python"
  - "prefect"
  - "k8s"
  - "yaml"
  - "temporal"
  - "ai"
category: "ai-ml"
categoryName: "AI & Machine Learning"
weight: 1
date: "2025-12-16"
draft: false
toc: true
---

# Open Source Workflow Orchestration on Kubernetes

You're in luck - there's a rich ecosystem of workflow tools built for K8s. Let me break down the landscape based on different workflow needs.

## Categories of Workflow Tools

1. **General workflow orchestration** (Temporal, Argo Workflows, Prefect)
2. **Data pipeline focused** (Airflow, Dagster, Prefect)
3. **CI/CD workflows** (Tekton, Argo Workflows)
4. **Serverless/function workflows** (Knative, Fission Workflows)
5. **Lightweight script orchestration** (Windmill, Kestra)

## Production-Grade Orchestrators

### **Temporal** ⭐ Most Robust
```yaml
# What it is
Durable execution engine - workflows survive failures/restarts
```

**Architecture**:
- **Temporal Server**: Go-based, stateful (requires DB)
- **Workers**: Your code (Python/Go/Java/TypeScript/.NET)
- **Persistence**: PostgreSQL, MySQL, or Cassandra
- **License**: MIT

**K8s Deployment**:
```bash
helm repo add temporal https://temporal.io/charts
helm install temporal temporal/temporal \
  --set server.replicaCount=3 \
  --set cassandra.enabled=false \
  --set postgresql.enabled=true
```

**Strengths**:
- **Guaranteed execution** - workflow state persists through crashes
- **Long-running workflows** - can run for days/months
- **Timeouts & retries** - built-in, not your problem
- **Versioning** - deploy new code without breaking running workflows
- **Visibility** - excellent UI for debugging

**Weaknesses**:
- Complex infrastructure (needs DB, multiple services)
- Learning curve for "durable execution" concepts
- Resource overhead

**Best for**: Mission-critical workflows where you can't afford data loss or stuck states

**Agent workflows**: Perfect for long-running agents that need guaranteed completion

---

### **Argo Workflows** ⭐ K8s Native
```yaml
# What it is
Container-native workflow engine - each step is a pod
```

**Architecture**:
- **Workflow Controller**: Watches K8s CRDs
- **Steps**: Each step = container/pod
- **Persistence**: K8s etcd or external DB
- **License**: Apache 2.0

**K8s Deployment**:
```bash
kubectl create namespace argo
kubectl apply -n argo -f \
  https://raw.githubusercontent.com/argoproj/argo-workflows/stable/manifests/quick-start-postgres.yaml
```

**Strengths**:
- **K8s native** - workflows as YAML CRDs
- **DAG support** - complex dependencies
- **Artifact passing** - between steps via S3/Minio
- **Templates** - reusable workflow components
- **GitOps friendly** - everything is declarative

**Weaknesses**:
- Each step creates a pod (overhead)
- Not ideal for high-frequency tasks
- Steeper YAML learning curve

**Best for**: Data pipelines, ML training, batch jobs, CI/CD

**Agent workflows**: Good for containerized agent tasks, less ideal for interactive agents

---

### **Prefect** ⭐ Python Developer Friendly
```yaml
# What it is
Modern data workflow orchestration with Python-first API
```

**Architecture**:
- **Prefect Server**: FastAPI (Python)
- **Agents**: Pull work from queues
- **Persistence**: PostgreSQL
- **License**: Apache 2.0

**K8s Deployment**:
```bash
helm repo add prefect https://prefecthq.github.io/prefect-helm
helm install prefect-server prefect/prefect-server

# Or simpler
kubectl apply -f prefect-server-deployment.yaml
```

**Strengths**:
- **Python native** - write workflows in Python, not YAML
- **Dynamic workflows** - code-defined, not static DAGs
- **Great DX** - excellent documentation, modern UI
- **Hybrid execution** - work pools for different environments
- **Observability** - built-in monitoring

**Weaknesses**:
- Relatively newer (less battle-tested than Airflow)
- Smaller ecosystem than Airflow
- Python-only (not polyglot)

**Best for**: Data engineering teams, ML pipelines, Python shops

**Agent workflows**: Excellent - native Python makes LLM integration natural

---

### **Apache Airflow** - Industry Standard
```yaml
# What it is
Veteran workflow scheduler - DAG-based, widely adopted
```

**Architecture**:
- **Scheduler**: Triggers tasks
- **Webserver**: UI
- **Workers**: Execute tasks (Celery/K8s executor)
- **Metadata DB**: PostgreSQL
- **License**: Apache 2.0

**K8s Deployment**:
```bash
helm repo add apache-airflow https://airflow.apache.org
helm install airflow apache-airflow/airflow \
  --set executor=KubernetesExecutor
```

**Strengths**:
- **Mature ecosystem** - thousands of operators
- **Battle-tested** - used at Airbnb, Netflix, etc.
- **KubernetesExecutor** - each task as K8s pod
- **Rich UI** - comprehensive DAG visualization
- **Community** - huge, lots of examples

**Weaknesses**:
- **Static DAGs** - must be defined upfront
- **Complexity** - many moving parts
- **Legacy feel** - improving but shows age
- **Python 2 roots** - some legacy cruft

**Best for**: Data pipelines, ETL, scheduled jobs

**Agent workflows**: Workable but not ideal - static DAGs clash with dynamic agents

---

## Lightweight/Developer-Focused Options

### **Windmill** ⭐ DevOps Friendly
```yaml
# What it is
Developer platform for workflows, scripts, and apps
```

**Architecture**:
- **Server**: Rust (fast, low resource)
- **Workers**: Deno/Python/Bash/Go
- **Database**: PostgreSQL
- **License**: AGPLv3

**K8s Deployment**:
```bash
helm repo add windmill https://windmill-labs.github.io/windmill-helm-charts
helm install windmill windmill/windmill
```

**Strengths**:
- **Low overhead** - Rust is efficient
- **Multi-language** - Python, TypeScript, Go, Bash
- **Git sync** - workflows from Git repos
- **Auto-generated UI** - for scripts
- **Fast execution** - designed for speed
- **Self-service** - non-devs can build flows

**Weaknesses**:
- Smaller community than others
- Newer product (less proven at scale)
- AGPLv3 license (copyleft)

**Best for**: Internal tools, DevOps automation, rapid prototyping

**Agent workflows**: Good fit - supports Python LLM libraries natively

---

### **Kestra**
```yaml
# What it is
Event-driven workflow orchestration
```

**Architecture**:
- **Core**: Java/Micronaut
- **Workers**: Multi-language via plugins
- **Database**: PostgreSQL/MySQL
- **License**: Apache 2.0

**K8s Deployment**:
```bash
helm repo add kestra https://helm.kestra.io
helm install kestra kestra/kestra
```

**Strengths**:
- **Event-driven** - trigger on events, not just schedules
- **Plugin ecosystem** - 300+ plugins
- **YAML DSL** - declarative workflows
- **Real-time** - streaming support

**Weaknesses**:
- Java ecosystem (less common in AI/data space)
- Smaller community
- Less mature than alternatives

**Best for**: Event-driven workflows, real-time processing

**Agent workflows**: Decent - event-driven fits agent callbacks

---

## Specialized Options

### **Dagster**
```yaml
# What it is
Data orchestration platform with strong typing
```

**License**: Apache 2.0

**Strengths**:
- **Software-defined assets** - declare what you produce
- **Type system** - catch errors before runtime
- **Data lineage** - track data through pipelines
- **Testing** - first-class testing support

**Best for**: Data platforms, analytics engineering

**Agent workflows**: Overkill unless you're already using Dagster

---

### **Tekton**
```yaml
# What it is
K8s-native CI/CD framework
```

**License**: Apache 2.0

**Strengths**:
- Pure K8s CRDs (Tasks, Pipelines)
- GitOps native
- Cloud-native buildpacks

**Best for**: CI/CD, not general workflows

**Agent workflows**: Wrong tool for the job

---

## Comparison Matrix

| Tool | Complexity | Resource Use | Agent Fit | Best Use Case |
|------|-----------|--------------|-----------|---------------|
| **Temporal** | High | Medium-High | ⭐⭐⭐⭐⭐ | Mission-critical agents |
| **Argo Workflows** | Medium | Medium | ⭐⭐⭐ | Containerized pipelines |
| **Prefect** | Low-Medium | Low-Medium | ⭐⭐⭐⭐⭐ | Python AI workflows |
| **Airflow** | High | High | ⭐⭐ | Scheduled data pipelines |
| **Windmill** | Low | Low | ⭐⭐⭐⭐ | DevOps automation |
| **Kestra** | Medium | Medium | ⭐⭐⭐ | Event-driven flows |
| **Dagster** | Medium | Medium | ⭐⭐ | Data platforms |

## Agent-Specific Considerations

### **For AI Agent Workflows, You Need**:
1. **Dynamic execution** - agents change plans mid-flight
2. **Long-running support** - some agent tasks take hours
3. **Easy Python integration** - most LLM SDKs are Python
4. **Retry/error handling** - LLM calls fail unpredictably
5. **State persistence** - agent context across steps
6. **Observability** - trace agent reasoning chains

### **Best Matches for Agents**:

**1. Temporal (if you need bulletproof reliability)**
```python
# Temporal workflow
@workflow.defn
class AgentWorkflow:
    @workflow.run
    async def run(self, goal: str) -> str:
        # This persists through failures
        context = await workflow.execute_activity(
            gather_context, goal
        )
        
        # This retries automatically
        result = await workflow.execute_activity(
            run_agent, context
        )
        
        return result
```

**2. Prefect (if you want Python simplicity)**
```python
# Prefect flow
from prefect import flow, task

@task(retries=3)
def call_llm(prompt: str) -> str:
    return anthropic.messages.create(...)

@flow
def agent_flow(goal: str):
    context = gather_context(goal)
    result = call_llm(context)
    return process_result(result)
```

**3. Windmill (if you want lightweight)**
```python
# Windmill script - auto-becomes workflow step
def main(user_query: str):
    # Direct Python, runs in isolated worker
    from anthropic import Anthropic
    client = Anthropic()
    return client.messages.create(...)
```

## Architecture Patterns on K8s

### **Pattern 1: Agent as Job**
```yaml
# Simple one-off agent execution
apiVersion: batch/v1
kind: Job
metadata:
  name: agent-task
spec:
  template:
    spec:
      containers:
      - name: agent
        image: my-agent:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
```

**When**: Simple, stateless agents

---

### **Pattern 2: Agent with Temporal**
```yaml
# Temporal handles orchestration, K8s runs workers
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-workers
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: worker
        image: my-temporal-worker:latest
        env:
        - name: TEMPORAL_SERVER: temporal-frontend:7233
```

**When**: Long-running, stateful agent workflows

---

### **Pattern 3: Agent with Prefect**
```yaml
# Prefect work pool pulls from K8s
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prefect-worker
spec:
  template:
    spec:
      containers:
      - name: worker
        image: prefecthq/prefect:2-python3.11
        command: ["prefect", "worker", "start", "--pool", "k8s-pool"]
```

**When**: Python-heavy agent workflows

---

### **Pattern 4: Stateless Functions**
```yaml
# Knative serving for agent API
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: agent-api
spec:
  template:
    spec:
      containers:
      - image: my-agent-api:latest
```

**When**: Agent as API endpoint (scale-to-zero)

## My Recommendation for Your Use Case

Based on your DevOps background and GitOps experience (ArgoCD):

### **Start Here: Argo Workflows + Python**
```yaml
# Why:
# 1. You already know Argo ecosystem
# 2. K8s native (fits your mental model)
# 3. GitOps friendly (store workflows in Git)
# 4. Can integrate with ArgoCD

# Example agent workflow
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: agent-research-
spec:
  entrypoint: agent-pipeline
  templates:
  - name: agent-pipeline
    dag:
      tasks:
      - name: gather-context
        template: python-task
      - name: run-agent
        dependencies: [gather-context]
        template: llm-task
      - name: synthesize
        dependencies: [run-agent]
        template: python-task
        
  - name: python-task
    container:
      image: python:3.11
      command: [python]
      source: |
        # Your agent code here
```

### **Graduate To: Temporal (when you need reliability)**

Once you hit limitations with Argo (state management, long-running workflows), migrate to Temporal.

### **Alternative: Prefect (if Python-first appeals)**

If your team prefers writing Python over YAML, Prefect might feel more natural.

## Quick Decision Tree

```
Do you need guaranteed execution through failures?
├─ Yes → Temporal
└─ No ↓

Is your team primarily Python developers?
├─ Yes → Prefect
└─ No ↓

Do you want K8s-native, GitOps-friendly?
├─ Yes → Argo Workflows
└─ No ↓

Need lightweight, fast iteration?
├─ Yes → Windmill
└─ Still here? → Probably Airflow for data, Argo for everything else
```

Want me to walk through setting up an actual agent workflow in Argo or Prefect on K8s? I can show you the full deployment including observability.
