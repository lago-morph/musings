# Content Analysis for Hugo Documentation Site

> **Note**: This is a working file used during content analysis. It contains detailed processing notes and should not be loaded automatically in new sessions.

## Document Inventory

Based on analysis of existing markdown files, here are the documents to be processed:

### AI & Machine Learning Category
- `ai/agents/agentic_computing_overview_and_tools.md`
  - **Title**: "Agentic Computing Overview and Tools"
  - **Summary**: Comprehensive guide to AI agents, covering architectures like ReAct patterns, multi-agent systems, and evaluation of agent platforms including LangChain, Temporal, and Prefect for different use cases.
  - **Keywords**: ["agentic-computing", "ai-agents", "langchain", "temporal", "react-pattern", "multi-agent", "llm", "automation"]

- `ai/agents/langchain_architecture.md`
  - **Title**: "LangChain and LangGraph Architecture"
  - **Summary**: Detailed architectural overview of LangChain as a foundation library and LangGraph as an orchestration layer, explaining when to use each for different workflow patterns and agent implementations.
  - **Keywords**: ["langchain", "langgraph", "llm", "workflows", "state-machines", "ai-orchestration"]

- `ai/mcp/k8s_mcp_servers.md`
- `ai/observability/llm_tracing_metrics_comparison.md`
- `ai/orchestration/n8n_overview.md`
- `ai/tools/kiro_ide_comparison_tools.md`

### Development Platforms Category
- `devplatform/documentation/backstage_techdocs_pros_cons.md`
  - **Title**: "Backstage TechDocs: Pros and Cons"
  - **Summary**: Analysis of Backstage TechDocs documentation platform, comparing docs-as-code approach with wiki-style alternatives, covering integration options and hybrid approaches for technical documentation.
  - **Keywords**: ["backstage", "techdocs", "documentation", "docs-as-code", "wiki", "confluence", "mkdocs"]

- `devplatform/documentation/in_browser_editing_tools.md`
- `devplatform/documentation/notion_overview.md`
- `devplatform/gitops/crossplane_solution.md`
  - **Title**: "Crossplane v2 Solutions for Database Restore Workflows"
  - **Summary**: Detailed exploration of Crossplane v2 composition functions for implementing declarative database restore workflows, comparing different approaches from custom XRDs to provider integrations.
  - **Keywords**: ["crossplane", "kubernetes", "gitops", "database-restore", "composition-functions", "declarative", "infrastructure"]

- `devplatform/gitops/imperitive_in_declarative.md`
- `devplatform/gitops/job_configmap_crossplane_abstraction.md`
- `devplatform/gitops/job_plus_configmap_annotation.md`
- `devplatform/kargo_argocd/comprehensive_guide.md`
  - **Title**: "Kargo and ArgoCD: A Comprehensive Guide"
  - **Summary**: Comprehensive guide to Kargo and ArgoCD integration for GitOps continuous promotion, covering freight management, multi-repository artifacts, and progressive delivery patterns across environments.
  - **Keywords**: ["kargo", "argocd", "gitops", "continuous-promotion", "freight", "progressive-delivery", "kubernetes"]

- Other kargo_argocd files...

### Infrastructure Category
- `production/production-readiness-overview.md`
  - **Title**: "Production Readiness Guide: From Docker Compose to Kubernetes"
  - **Summary**: Comprehensive guide for transitioning from single-server deployments to Kubernetes, covering replica management, data durability, observability, runbooks, and blue/green deployment patterns for production systems.
  - **Keywords**: ["production-readiness", "kubernetes", "docker-compose", "observability", "runbooks", "blue-green-deployment", "operations"]

- `production/prompt-guide.md`
- `production/runbooks.md`
- `helm/helm_layered_abstraction.md`
  - **Title**: "Helm Layered Abstraction with ArgoCD"
  - **Summary**: Solutions for managing shared values across multiple Helm chart layers using ArgoCD, covering values repository patterns, Kustomize integration, and umbrella chart approaches for GitOps workflows.
  - **Keywords**: ["helm", "argocd", "gitops", "values-management", "layered-architecture", "kustomize", "umbrella-charts"]

- `helm/testing/` (directory)
- `eks_crossplane/initial/` (directory)
- `domainmodel/initial_with_correlation/` (directory)

### Workflows Category
- `workflow/kubernetes_based.md`
  - **Title**: "Open Source Workflow Orchestration on Kubernetes"
  - **Summary**: Comprehensive comparison of workflow orchestration tools for Kubernetes including Temporal, Argo Workflows, Prefect, and Airflow, with specific focus on AI agent workflows and production deployment patterns.
  - **Keywords**: ["workflow-orchestration", "kubernetes", "temporal", "argo-workflows", "prefect", "airflow", "ai-agents", "automation"]

- `workflow/serverless_function_workflow_tools_for_kubernetes.md`

## Category Definitions

### 1. AI & Machine Learning
**Description**: Information about AI agents, machine learning tools, and frameworks
**Scope**: Agentic computing, LLM orchestration, AI observability, agent architectures
**Weight**: 1

### 2. Development Platforms  
**Description**: Documentation platforms, GitOps workflows, and development infrastructure
**Scope**: Backstage, GitOps tools, CI/CD, developer experience platforms
**Weight**: 2

### 3. Infrastructure
**Description**: Kubernetes, Helm, production readiness, and infrastructure management
**Scope**: Container orchestration, production operations, infrastructure as code
**Weight**: 3

### 4. Workflows
**Description**: Orchestration tools, automation patterns, and workflow management
**Scope**: Workflow engines, process automation, task orchestration
**Weight**: 4

## Processing Notes

### Excluded Files
- `README.md` - Project readme, not documentation content
- Any files in directories marked as `closed` in the file tree
- Hidden files and directories (starting with `.` except standard ones)

### Title Extraction Rules
1. Look for first `# Header` in document
2. If no header, use filename without extension and path
3. Convert kebab-case and snake_case to Title Case
4. Remove file extensions and path prefixes

### Summary Generation Rules
1. Extract first 2-3 sentences from document introduction
2. If no clear introduction, summarize based on headers and content structure
3. Focus on what the document covers and its primary purpose
4. Keep summaries between 2-3 sentences, approximately 50-100 words

### Keyword Extraction Rules
1. Extract technical terms, tool names, and concepts
2. Convert to lowercase with hyphens
3. Include both specific tools (langchain, kubernetes) and general concepts (gitops, ai-agents)
4. Aim for 5-8 keywords per document
5. Ensure keywords are useful for taxonomy and filtering