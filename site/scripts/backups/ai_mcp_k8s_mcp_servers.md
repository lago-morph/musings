I'll search for information about open source Kubernetes MCP servers for you.Based on my research, here's what I found about open source Kubernetes MCP servers:

## Available Open Source Kubernetes MCP Servers

Several open source options exist:

**1. containers/kubernetes-mcp-server** (Red Hat/Podman team)
- Native Go implementation that interacts directly with the Kubernetes API
- No external dependencies (no kubectl, Helm, Node.js, or Python required)
- Supports both Kubernetes and OpenShift
- Available as native binaries for Linux, macOS, Windows, plus npm/Python packages and container images
- Features: CRUD operations on all resources, pod management, Helm support, KubeVirt VMs

**2. Flux159/mcp-server-kubernetes**
- TypeScript/Node.js-based implementation
- Uses kubectl and Helm under the hood
- Available as npm package
- Non-destructive mode support with secrets masking
- Includes troubleshooting prompts and workflows

**3. feiskyer/mcp-kubernetes-server**
- Python-based implementation
- Available on PyPI
- Also relies on kubectl and Helm commands

**4. Amazon EKS MCP Server**
- AWS-specific, now offered as fully managed service (preview)
- Open source version available for local installation
- EKS-optimized with CloudWatch integration

**5. Stacklok's Kubernetes MCP Server (via ToolHive)**
- Go-based implementation
- Focused on enterprise security with RBAC, network policies
- Deployed via Kubernetes Operator

## Maturity & Production Readiness

**Developer Preview / Early Stage:**
Most of these servers are in **developer preview** or early development stages. Red Hat explicitly describes their implementation as a "developer preview," and AWS's fully managed version is also in "preview."

**Production Considerations:**
- **containers/kubernetes-mcp-server**: Most mature in terms of architecture (native Go, no external dependencies, high performance). Red Hat recommends running with dedicated service accounts and read-only mode as safeguards
- **AWS EKS MCP Server**: The fully managed version addresses production concerns with cloud hosting, but still in preview
- **Stacklok/ToolHive**: Explicitly positioned for production with security-first design, though still emerging

**Security Posture:**
All implementations recommend:
- Running with least-privilege service accounts
- Using read-only or non-destructive modes initially
- RBAC-controlled access
- Secrets masking for sensitive data

## Functionality Provided

Common capabilities across servers:

**Resource Management:**
- List, get, create, update, delete any Kubernetes resources
- Support for custom resources
- Multi-cluster support (via kubeconfig)

**Pod Operations:**
- View logs
- Execute commands in pods
- Port forwarding
- Resource usage metrics
- Cleanup of problematic pods

**Application Deployment:**
- Helm chart installation/upgrade
- YAML manifest application
- Manifest generation from natural language

**Troubleshooting:**
- Systematic diagnostic workflows
- Natural language queries about cluster state
- Error analysis and remediation suggestions

**Additional Features:**
- VirtualMachine management (containers/kubernetes-mcp-server with KubeVirt)
- CloudWatch integration (AWS EKS)
- Network policy enforcement (ToolHive)

## Bottom Line

While there are several solid open source options, **none are considered production-grade yet**. They're in the "safe to experiment with, use caution in production" stage. The **containers/kubernetes-mcp-server** appears most technically mature due to its native implementation, but all vendors recommend starting with read-only access and gradually expanding permissions as teams gain confidence.

Here are the GitHub links for the Kubernetes MCP server projects:

## Main Open Source Projects

**1. containers/kubernetes-mcp-server** (Red Hat/Podman team)
- https://github.com/containers/kubernetes-mcp-server

**2. Flux159/mcp-server-kubernetes**
- https://github.com/Flux159/mcp-server-kubernetes

**3. feiskyer/mcp-kubernetes-server**
- https://github.com/feiskyer/mcp-kubernetes-server

**4. Stacklok ToolHive** (MCP server deployment framework)
- https://github.com/stacklok/mcp-go (the Kubernetes MCP server implementation)
- ToolHive repository (for deployment/management)

**5. k8s-mcp-server** (lightweight Go implementation)
- Repository mentioned in Kubernetes discussion forums but specific link would need to be searched

**6. Amazon EKS MCP Server**
- The open source version should be available on AWS's GitHub, though the search results primarily discussed the managed service

## Related Projects

**kmcp** (Kubernetes MCP Controller for deploying MCP servers)
- Part of the kagent.dev ecosystem for deploying MCP servers on Kubernetes
- https://kagent.dev/docs/kmcp/

The most actively developed and documented appear to be the **containers/kubernetes-mcp-server** and **Flux159/mcp-server-kubernetes** projects based on the search results.
