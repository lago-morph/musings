# n8n Overview

n8n is a **workflow automation platform** that lets you connect different apps and services together to automate repetitive tasks. Think of it as a visual programming tool where you create workflows by connecting nodes in a flowchart-like interface.

## What Problems Does n8n Solve?

**Integration between services**: Moving data between apps that don't natively talk to each other (Slack → Google Sheets, webhook → email, database → CRM, etc.)

**Automating repetitive tasks**: Things like processing form submissions, syncing data across platforms, or triggering notifications based on events

**Building custom automations**: Creating sophisticated workflows with conditional logic, data transformation, and multi-step processes without writing much code

## Key Features

- **Self-hostable**: You can run it on your own infrastructure (important for data privacy/compliance)
- **Visual workflow builder**: Drag-and-drop interface for creating automation flows
- **400+ integrations**: Pre-built connectors for popular services
- **Code when needed**: JavaScript support for custom transformations
- **Trigger-based or scheduled**: Workflows can run on webhooks, schedules, or manual execution

## Alternative Approaches

### **Cloud-only SaaS alternatives**
- **Zapier**: Most popular, easiest to use, but expensive at scale and cloud-only
- **Make (formerly Integromat)**: More complex workflows than Zapier, visual interface, cloud-hosted
- **Tray.io**: Enterprise-focused, powerful but pricier

### **Developer-first alternatives**
- **Temporal**: Write workflows as code (Go/Java/Python), excellent for complex state management and reliability
- **Prefect/Airflow**: Python-based workflow orchestration, popular in data engineering
- **Inngest**: Event-driven workflow engine with code-first approach
- **Windmill**: Similar to n8n but more code-centric, also self-hostable

### **Event-driven architectures**
- **Apache Kafka** + **stream processing**: For high-volume, real-time data pipelines
- **AWS Step Functions** or **Google Cloud Workflows**: Cloud-native state machines
- **Message queues** (RabbitMQ, Redis) + custom workers: Build your own orchestration

### **Low-code platforms**
- **Retool Workflows**: Tied to Retool's internal tool builder
- **Pipedream**: Developer-friendly with lots of free tier, cloud-hosted
- **IFTTT**: Consumer-focused, very simple but limited

### **DIY approaches**
- **Cron jobs + scripts**: Simple, full control, but no orchestration/visibility
- **CI/CD pipelines** (GitHub Actions, GitLab CI): Can repurpose for automation workflows
- **Custom microservices**: Complete flexibility but high maintenance overhead

## When n8n Makes Sense

Given your DevOps background, n8n fits well when you want:
- Visual workflows that non-developers can understand/modify
- Self-hosted solution (keeps data in your infrastructure)
- Mix of pre-built integrations with ability to write custom code
- Something between "no-code" (too limiting) and "pure code" (too much overhead)

The sweet spot is **internal automation workflows** where you need quick integration between 3-10 services without building custom microservices for each connection.

What kind of automation problem are you looking at? That might help narrow down whether n8n or one of the alternatives would be a better fit.

n8n is a **general workflow automation tool** - AI agents are just one recent use case, not its primary purpose.

## Original Purpose (Pre-AI Hype)

n8n was built for traditional workflow automation:
- Moving data between business apps
- Processing webhooks and API calls
- Scheduled data syncing
- Form submission handling
- Notification triggers

Think: "When a new row appears in Google Sheets, create a Jira ticket and send a Slack message"

## AI Integration (Recent Addition)

n8n added AI capabilities as LLMs became popular, but it's layered on top:
- **LLM nodes**: Call OpenAI, Anthropic, local models
- **Vector store integrations**: Pinecone, Qdrant for RAG
- **Agent nodes**: Chain multiple LLM calls with tool use
- **AI agent templates**: Pre-built workflows for common patterns

The AI features make it useful for building AI agents, but that's ~10-20% of use cases.

## AI Agent-Specific Alternatives

If you're specifically building AI agents, these are more purpose-built:

**Agent frameworks:**
- **LangChain/LangGraph**: Python/JS frameworks for complex agent workflows
- **AutoGen**: Microsoft's multi-agent framework
- **CrewAI**: Orchestrate teams of AI agents
- **Semantic Kernel**: Microsoft's agent SDK

**Agent platforms:**
- **Relevance AI**: Build and deploy AI agents/workflows
- **Stack AI**: Visual AI agent builder
- **Flowise**: Open-source LangChain UI (similar to n8n but AI-first)
- **LangFlow**: Another visual LangChain builder

**AI-native workflow tools:**
- **Dust.tt**: AI assistants with workflow capabilities
- **Superagent**: Deploy AI agents with APIs

## Key Difference

**n8n**: "I have a workflow that happens to use AI in steps 3 and 7"
**Agent frameworks**: "I'm building an AI system that autonomously handles tasks"

n8n is great for **deterministic workflows with AI components** (RAG pipelines, content generation flows, data enrichment with LLMs).

It's less ideal for **autonomous agents** that need complex reasoning, memory, and self-directed tool use - those benefit from frameworks purpose-built for agent patterns.

Given your DevOps background and interest in practical tooling, n8n would be good for things like:
- Automated incident response with AI analysis
- Documentation generation from logs/metrics
- Intelligent alerting with LLM filtering
- GitOps workflows with AI-powered PR analysis

Are you looking at general automation or specifically trying to build AI agents?
