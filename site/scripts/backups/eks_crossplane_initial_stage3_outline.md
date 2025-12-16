---
title: "Stage 3: Implementation Patterns - Outline (Crossplane 2.1)"
summary: "Stage 3: Implementation Patterns - Outline (Crossplane 2.1) is a development platform document covering Stage 3: Implementation Patterns - Outline (Crossplane 2.1) and Purpose. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "function"
  - "crossplane"
  - "helm"
  - "deployment"
  - "platform"
  - "api"
  - "aws"
  - "observability"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

# Stage 3: Implementation Patterns - Outline (Crossplane 2.1)

## Purpose
Describe the structural and organizational patterns for each approach using Crossplane 2.1 features. Focus on how manifests are organized, how dependencies are handled, composition functions, and the key architectural decisions that differentiate each approach.

---

## Proposed Outline Structure

### 3.1 Approach 1: Direct Managed Resources
- **Manifest Organization**
  - File structure and naming conventions
  - Dependency ordering strategy
  - Namespace vs cluster-scoped resources
- **Resource Reference Patterns**
  - Crossplane 2.1 reference resolution (matchControllerRef, resolvers)
  - Match labels and selectors for dynamic references
  - External name usage patterns
- **Key Decisions**
  - When to use references vs match selectors
  - Managing resource lifecycle and deletion policies
  - Handling parallel vs sequential provisioning

### 3.2 Approach 2: Composite Resources (XRDs)
- **XRD Design (Crossplane 2.1)**
  - XR-only pattern (no Claims in 2.1)
  - API surface design (what parameters to expose)
  - Namespace-scoped XRs and their implications
- **Composition Functions**
  - Function pipeline architecture (replacing patches)
  - Using composition functions for resource generation
  - Function chaining and data flow
- **Composition Structure**
  - Modern composition mode (Pipeline vs Resources)
  - Composition functions vs traditional patch-and-transform
  - Connection secrets and composition references
- **Key Decisions**
  - Traditional patches vs composition functions
  - Function selection and ordering in pipeline
  - Handling composition updates and versioning

### 3.3 Approach 3a: Opinionated Platform
- **Provider/Platform Selection**
  - Upbound Official Provider Families (recommended for 2.1)
  - Pre-built Crossplane Configurations
  - Provider family advantages over monolithic providers
- **Configuration Packages**
  - Using Crossplane Configuration packages
  - Dependency management between configurations
  - Package versioning and updates
- **Key Decisions**
  - Configuration package granularity
  - Customization vs standardization trade-offs
  - Package dependency management

### 3.4 Approach 3b: Multi-Cloud Abstraction
- **Abstraction Layer Design**
  - Cloud-agnostic XRD definitions
  - Composition selection via environment configs
  - Provider family approach for multi-cloud
- **Composition Selectors**
  - Using compositionSelector and compositionRef
  - Environment-based composition selection
  - Label-based routing to cloud-specific compositions
- **Key Decisions**
  - XRD API design for portability
  - Composition selection strategy
  - Handling cloud-specific features

### 3.5 Approach 3c: Fargate-First Architecture
- **Fargate-Specific Resources**
  - Fargate Profile managed resources
  - Pod Execution Role configuration
  - OIDC provider for pod identities
- **Composition Adaptations**
  - Conditional resource rendering (via functions)
  - Fargate profile selectors and namespaces
- **Key Decisions**
  - Namespace-based vs label-based Fargate selection
  - Handling workloads not suitable for Fargate
  - IRSA configuration for Fargate pods

### 3.6 Approach 3d: vCluster-Based Multi-Tenancy
- **vCluster Provider Integration**
  - Using provider-helm or provider-kubernetes for vCluster
  - vCluster Helm chart deployment via Crossplane
  - vCluster CRD management
- **Management Cluster Pattern**
  - Standard EKS with Crossplane 2.1
  - Provider configuration for in-cluster resources
  - Resource sizing and quotas
- **Workload vCluster Composition**
  - XRD for vCluster provisioning
  - Composition function for vCluster configuration
  - Network and storage configuration
- **Key Decisions**
  - vCluster deployment mechanism (Helm vs native)
  - Host cluster provider configuration
  - vCluster isolation and resource limits

### 3.7 Approach 3e: Kubernetes-Native Tooling
- **Tooling Deployment Strategy**
  - Using provider-helm for K8s-native tools
  - Using provider-kubernetes for CRD-based tools
  - Composition functions for tool configuration
- **Tool Stack**
  - Vault (provider-helm for deployment)
  - Harbor (provider-helm for deployment)
  - cert-manager (provider-kubernetes for CRDs)
  - NGINX Ingress (provider-helm)
  - external-dns (provider-helm)
- **Integration Patterns**
  - Tool dependencies and ordering
  - Configuration secrets management
  - AWS integration (S3 for Harbor, Route53 for DNS)
- **Key Decisions**
  - Crossplane-managed vs externally-managed tools
  - Tool lifecycle and upgrade management
  - Composition functions for tool configuration

### 3.8 Approach 3f: ECS Control Plane Alternative
- **ECS-Based Crossplane Deployment**
  - ECS Task Definition for Crossplane
  - Fargate vs EC2 launch type
  - Persistent storage for Crossplane (EFS or S3)
- **Provider Configuration in ECS**
  - AWS credentials via IAM task roles
  - ProviderConfig for ECS-hosted Crossplane
  - Network configuration for ECS tasks
- **State Management**
  - etcd as sidecar vs external
  - Backup and restore strategies
- **Key Decisions**
  - State persistence approach
  - Crossplane version and upgrade path
  - Observability for ECS-based control plane

---

## Crossplane 2.1 Specific Patterns

### Composition Functions
- Function pipeline architecture
- When to use functions vs patches
- Available function types (Go templates, patch-and-transform, etc.)

### Provider Families
- Official Provider Families vs monolithic providers
- Upjet/Terraform-based providers in 2.1
- Provider configuration and credentials

### Resource Management
- Deletion policies and management policies
- Connection secrets in 2.1
- ProviderConfig references and inheritance

### Namespace Scoping
- XR namespace scoping implications
- Cross-namespace resource references
- RBAC considerations for namespace-scoped resources

---

## General Patterns Across All Approaches

### Provider Configuration (2.1 Style)
- ProviderConfig with credentials
- DeploymentRuntimeConfig for provider settings
- Provider package installation and configuration

### Workload Cluster Provisioning
- Template structure for each approach
- Composition function usage for templating
- Namespace organization and RBAC

---

## Review Questions

Before I flesh out the details:

1. **Composition Functions**: Should I recommend specific composition functions (e.g., function-patch-and-transform, function-go-templating) or keep it generic?

2. **Provider Selection**: For approach 3a (Opinionated), should I recommend Upbound's official provider families and specific Configuration packages?

3. **Level of Detail**: Should I include conceptual manifest snippets showing key Crossplane 2.1 features (composition functions, match selectors, etc.) or keep it purely descriptive?

4. **Function Pipeline Examples**: Should I show the structure of composition function pipelines or just describe them conceptually?

5. **Workload Templates**: Should Stage 3 discuss the workload cluster templates for each approach, or save that entirely for Stage 5 (Reference Implementation)?
