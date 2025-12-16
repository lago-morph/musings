# Self-Hosted Open Source Agent Tools

Here's the landscape of tools you can fully control and run on your own infrastructure.

## Agent Frameworks (Code-First)

### **LangChain + LangGraph** (Python/TypeScript)
- **License**: MIT
- **Self-host**: Everything runs in your code
- **Observability**: LangSmith is cloud (paid), but alternatives exist
- **Deployment**: Your choice - Docker, K8s, serverless
- **Best for**: Maximum flexibility, production-grade agents
- **Tracing alternatives**: OpenLIT (OSS), Phoenix (Arize OSS version)

```python
# Simple ReAct agent example
from langchain.agents import create_react_agent
from langchain.tools import Tool
```

### **AutoGen** (Python)
- **License**: CC-BY-4.0 / MIT
- **Self-host**: Fully local
- **Visualization**: AutoGen Studio (web UI, self-hosted)
- **Best for**: Multi-agent conversations, research workflows
- **Deployment**: Run anywhere Python runs

### **CrewAI** (Python)
- **License**: MIT
- **Self-host**: Yes
- **Focus**: Role-based multi-agent teams
- **Best for**: Task delegation across specialized agents
- **Deployment**: Standard Python deployment

### **Semantic Kernel** (C#, Python, Java)
- **License**: MIT
- **Self-host**: Yes
- **From**: Microsoft, but fully open
- **Best for**: Enterprise .NET environments
- **Integration**: Works well with Azure but not required

## Visual Workflow Builders

### **Flowise** ⭐ Recommended for visual + self-hosted
- **License**: Apache 2.0
- **Tech**: Node.js, React
- **Self-host**: Docker, K8s, or npm install
- **Features**:
  - Drag-and-drop LangChain workflows
  - Built-in vector DB integrations
  - API endpoints for each flow
  - Agent templates
  - Credential management
- **Debugging**: Flow execution logs, intermediate outputs
- **Deployment**: `docker run -p 3000:3000 flowiseai/flowise`
- **Best for**: Teams wanting visual UI without cloud dependency

### **Langflow**
- **License**: MIT
- **Tech**: Python (FastAPI) + React
- **Self-host**: Docker or pip install
- **Features**: Similar to Flowise, more Python-centric
- **Deployment**: Docker Compose or K8s
- **Best for**: Python shops, LangChain power users

### **n8n** (mentioned earlier)
- **License**: Sustainable Use License (source-available, self-host friendly)
- **Self-host**: Docker, K8s, npm
- **AI features**: LLM nodes, vector stores, agents
- **Best for**: General workflows with some AI, not pure agents
- **Note**: Enterprise features require license

### **Windmill**
- **License**: AGPLv3
- **Tech**: Rust + TypeScript
- **Self-host**: Docker, K8s
- **Features**: 
  - Run Python/TypeScript/Bash scripts as workflows
  - Can build agent patterns manually
  - Strong DevOps focus
- **Best for**: DevOps teams, script orchestration with AI

## Observability & Debugging (Self-Hosted)

### **OpenLIT** ⭐
- **License**: Apache 2.0
- **Features**:
  - OpenTelemetry-native LLM observability
  - Trace LangChain, OpenAI, Anthropic calls
  - Metrics, traces, cost tracking
  - Integrates with existing observability stack
- **Self-host**: Docker Compose
- **Best for**: Production monitoring with your own Prometheus/Grafana

### **Phoenix** (Arize AI)
- **License**: Elastic License 2.0
- **Features**:
  - LLM traces and evaluations
  - LangChain integration
  - Embeddings visualization
- **Self-host**: Docker or pip install
- **UI**: Web-based dashboard

### **Langfuse**
- **License**: MIT (core), AGPL (enterprise features)
- **Features**:
  - LLM observability and analytics
  - Prompt management
  - Evaluation datasets
- **Self-host**: Docker Compose
- **Best for**: Teams needing prompt versioning + observability

## Vector Databases (for Agent Memory)

### **Qdrant**
- **License**: Apache 2.0
- **Self-host**: Docker, K8s, binary
- **Best for**: Production vector search, fast

### **Weaviate**
- **License**: BSD-3
- **Self-host**: Docker, K8s
- **Features**: Hybrid search, multi-tenancy

### **Milvus**
- **License**: Apache 2.0
- **Self-host**: Docker Compose, K8s (complex)
- **Best for**: Large-scale deployments

### **ChromaDB**
- **License**: Apache 2.0
- **Self-host**: Pip install or Docker
- **Best for**: Simplicity, local development

## Orchestration Platforms (Build Your Own Agent Patterns)

### **Temporal**
- **License**: MIT
- **Self-host**: Docker Compose, K8s (Helm charts)
- **Agent use**: Build durable agent workflows with guaranteed execution
- **Best for**: Mission-critical agents that can't lose state
- **Complexity**: Higher DevOps overhead, but rock-solid

### **Airflow**
- **License**: Apache 2.0
- **Self-host**: K8s (common), Docker
- **Agent use**: Schedule and orchestrate LLM calls
- **Best for**: Data pipeline teams extending to AI agents

### **Prefect**
- **License**: Apache 2.0
- **Self-host**: Server runs anywhere
- **Agent use**: Python workflows with LLM steps
- **Best for**: Python-native teams

## Complete Self-Hosted Stacks

### **Option 1: Visual Agent Builder**
```
Flowise (UI + agent runtime)
+ Qdrant (vector memory)
+ OpenLIT (observability)
+ PostgreSQL (flow storage)
```
Deploy: Single Docker Compose file

### **Option 2: Code-First Production**
```
LangGraph (agent framework)
+ Temporal (orchestration)
+ Phoenix (debugging/tracing)
+ Weaviate (vector DB)
+ Redis (caching)
```
Deploy: Kubernetes cluster

### **Option 3: DevOps-Native**
```
Windmill (workflow engine)
+ Custom Python agents
+ ChromaDB (local vector store)
+ Prometheus + Grafana (metrics)
```
Deploy: Fits existing DevOps infrastructure

### **Option 4: Lightweight**
```
LangChain (framework)
+ FastAPI (expose as API)
+ SQLite + ChromaDB (persistence)
+ Structured logging
```
Deploy: Single Docker container

## Recommended Starting Point

Given your DevOps expertise:

**Week 1: Local experimentation**
```bash
# Install Flowise locally
docker run -d -p 3000:3000 flowiseai/flowise

# Or LangGraph for code-first
pip install langgraph langchain-anthropic
```

**Week 2: Add observability**
```bash
# Add OpenLIT
docker run -d -p 3000:3000 ghcr.io/openlit/openlit
```

**Week 3: Production pattern**
- Evaluate if you need Temporal-level reliability
- Or if simpler FastAPI + K8s deployment suffices

## Key Architecture Decisions

**Stateless vs Stateful**:
- Stateless: Agent runs on-demand, no persistent memory
- Stateful: Temporal/similar for long-running, resumable agents

**Synchronous vs Async**:
- Sync: Request → agent runs → response (simple)
- Async: Queue-based, agent runs in background (scalable)

**Single-tenant vs Multi-tenant**:
- Single: One agent instance per use case
- Multi: Shared infrastructure with isolation

**Model hosting**:
- Use Anthropic/OpenAI APIs (easier, costs per use)
- Self-host LLMs (Ollama, vLLM) for full control

## Quick Setup Example

Here's a self-hosted stack you could have running in 30 minutes:

```yaml
# docker-compose.yml
version: '3'
services:
  flowise:
    image: flowiseai/flowise
    ports:
      - "3000:3000"
    volumes:
      - flowise_data:/root/.flowise
    environment:
      - DATABASE_PATH=/root/.flowise
      
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  flowise_data:
  qdrant_data:
```

Run: `docker-compose up -d`

This gives you:
- Visual agent builder (Flowise)
- Vector database for memory (Qdrant)
- All running locally

What's your infrastructure like? Kubernetes cluster, VMs, or local Docker? That would help me suggest the best fit for your environment.
