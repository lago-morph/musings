---
title: "Crossplane EKS Management Cluster - Approach Overview & Comparison"
summary: "Crossplane EKS Management Cluster - Approach Overview & Comparison is a infrastructure document covering Crossplane EKS Management Cluster - Approach Overview & Comparison and Approach 1: Direct Managed Resources. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "cloud"
  - "aws"
  - "crossplane"
  - "eks"
  - "kubernetes"
  - "api"
  - "infrastructure"
  - "k8s"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# Crossplane EKS Management Cluster - Approach Overview & Comparison

## Approach 1: Direct Managed Resources

This approach uses individual Crossplane Managed Resources that map directly to AWS APIs. Each AWS resource (VPC, Subnet, InternetGateway, RouteTable, SecurityGroup, IAM Role, EKS Cluster, NodeGroup, etc.) is defined as a separate Kubernetes manifest.

### Characteristics
- One-to-one mapping between Crossplane resources and AWS resources
- All resource properties are explicitly defined
- Dependencies managed via Kubernetes references or external-name annotations
- No abstraction layer between user and AWS API

### Pros
- Maximum transparency - what you see is what you get
- Direct debugging - AWS console matches manifests exactly
- No "magic" - all configuration is explicit
- Easier for teams already familiar with AWS APIs
- Fine-grained control over every resource property

### Cons
- Highly verbose - a single EKS cluster requires 15-20+ separate resource definitions
- Repetitive - similar patterns repeated for each cluster
- Error-prone - manual management of dependencies and references
- No guardrails - easy to create insecure or non-compliant configurations
- Difficult to maintain consistency across multiple clusters
- Changes require updating many individual resources

---

## Approach 2: Composite Resources (XRDs)

This approach creates custom Kubernetes APIs (Composite Resource Definitions) that abstract away the underlying AWS resources. Users interact with high-level resources like `EKSCluster` which internally create all necessary AWS infrastructure.

### Characteristics
- Custom CRDs define the user-facing API
- Compositions define how XRDs map to underlying Managed Resources
- Users provide minimal parameters; defaults and best practices are encoded
- Platform team maintains the abstractions

### Pros
- Simplified interface - users provide 5-10 parameters instead of hundreds
- Enforced best practices - security, networking, compliance built into compositions
- Reusability - same composition used for all clusters
- Consistency - all clusters follow the same patterns
- Easier evolution - change composition once, affects all future clusters
- Clear separation between platform and application teams

### Cons
- Additional abstraction layer to understand and maintain
- Learning curve for XRD/Composition concepts
- Debugging requires understanding both the XRD and underlying resources
- Less flexibility for edge cases - may need escape hatches
- Initial development overhead to create good abstractions
- Versioning and migration complexity when changing compositions

---

## Approach 3: Alternative Architectural Patterns

This approach explores fundamentally different architectures enabled by various Crossplane providers and integrations. Each sub-approach represents a distinct philosophy or architectural pattern.

### 3a: Opinionated Platform Provider

**Philosophy:** Encode organizational best practices and compliance requirements into pre-built, opinionated abstractions.

**Characteristics:**
- Pre-configured compositions with sensible defaults
- Built-in security and compliance patterns
- Reduced decision fatigue - most choices already made
- Often includes observability and policy enforcement

**Pros:**
- Fastest time to value - minimal configuration needed
- Best practices built-in by default
- Reduced surface area for configuration errors
- Good for teams new to cloud infrastructure

**Cons:**
- Less flexibility - harder to deviate from opinions
- May not match your organization's specific requirements
- Potential vendor lock-in to specific patterns
- Learning curve to understand what's happening under the hood

---

### 3b: Multi-Cloud Abstraction Provider

**Philosophy:** Abstract away cloud-specific details to enable portability across AWS, GCP, Azure, etc.

**Characteristics:**
- Cloud-agnostic API definitions
- Provider-specific implementations behind common interface
- Focus on portable primitives (compute, storage, networking)
- Trade specificity for portability

**Pros:**
- Theoretical cloud portability
- Simplified mental model - one API for multiple clouds
- Easier multi-cloud strategy
- Reduces cloud-specific knowledge requirements

**Cons:**
- Lowest common denominator problem - can't use cloud-specific features
- Abstraction leaks when cloud differences emerge
- Debugging complexity across multiple provider implementations
- Portability often theoretical rather than practical
- Performance and feature gaps compared to native services

---

### 3c: Fargate-First Architecture

**Philosophy:** Eliminate node management entirely using serverless compute (AWS Fargate).

**Characteristics:**
- Management cluster runs on Fargate (no EC2 nodes)
- Workload clusters are Fargate profiles
- Focus on ephemeral, short-lived workload clusters
- Pay-per-pod pricing model

**Pros:**
- Zero node management overhead
- Automatic scaling and patching
- Perfect for ephemeral workload clusters
- Simplified security model (no SSH, no node access)
- Cost optimization for bursty workloads

**Cons:**
- Higher per-pod costs for steady-state workloads
- Fargate limitations (no DaemonSets, limited instance types, startup latency)
- Less control over underlying compute
- Not all Kubernetes features supported
- Debugging constraints

---

### 3d: vCluster-Based Multi-Tenancy

**Philosophy:** Use virtual clusters (vClusters) to maximize density and resource sharing while maintaining isolation.

**Characteristics:**
- Single "host" EKS cluster runs the management plane
- Workload "clusters" are actually vClusters (virtual clusters)
- Much lighter weight than full EKS clusters
- Shared underlying infrastructure with logical isolation

**Pros:**
- Dramatically reduced cost - one EKS cluster supports many workload "clusters"
- Faster provisioning - vClusters spin up in seconds
- Perfect for development/testing environments
- Strong multi-tenancy isolation
- Easier upgrades - upgrade host cluster, vClusters inherit

**Cons:**
- Not true cluster isolation - shares kernel and some resources
- Complexity in networking and service mesh integration
- Resource contention possible between vClusters
- Less suitable for strict compliance requirements
- Learning curve for operational model

---

### 3e: Kubernetes-Native Tooling Architecture

**Philosophy:** Minimize AWS-specific dependencies by using cloud-agnostic Kubernetes ecosystem tools.

**Characteristics:**
- Vault instead of AWS Secrets Manager
- Harbor instead of ECR
- cert-manager instead of ACM
- NGINX Ingress instead of AWS Load Balancer Controller
- External-DNS for route53 (minimal AWS coupling)

**Pros:**
- Cloud portability - easier to migrate to different cloud
- Consistent tooling across environments
- Rich Kubernetes ecosystem features
- Often better integration with GitOps workflows
- Skills transfer across clouds

**Cons:**
- Additional operational burden - you manage these services
- More infrastructure to maintain and secure
- Potentially higher resource costs (running Harbor, Vault, etc.)
- May sacrifice AWS-native integrations and optimizations
- Increased complexity in initial setup

---

### 3f: ECS as Control Plane Alternative

**Philosophy:** Use ECS for the management cluster control plane, Crossplane manages both ECS tasks and EKS workload clusters.

**Characteristics:**
- Management cluster components run as ECS tasks
- Crossplane controller runs in ECS
- Provisions EKS clusters as workload clusters
- Hybrid container orchestration model

**Pros:**
- Potentially lower management cluster costs
- Simpler management plane (no Kubernetes overhead for management)
- Familiar to teams already using ECS
- Fine-grained IAM controls at task level

**Cons:**
- Unusual architecture - less community support
- Crossplane primarily designed for Kubernetes
- Complexity in managing ECS-based control plane
- Limited tooling compared to Kubernetes-native approach
- Mixing orchestrators increases cognitive load

---

## Summary Comparison Table

| Criteria | Direct MRs | XRDs | Opinionated | Multi-Cloud | Fargate | vCluster | K8s-Native | ECS Control Plane |
|----------|------------|------|-------------|-------------|---------|----------|------------|-------------------|
| **Complexity** | Low (simple) | Medium | Low | Medium-High | Medium | Medium-High | High | High |
| **Verbosity** | Very High | Low | Very Low | Low | Medium | Low | Medium | Medium |
| **AWS Coupling** | High | High | High | Low | Very High | Medium | Low | Very High |
| **Portability** | None | None | None | High | None | Medium | High | None |
| **Operational Overhead** | Low | Low | Very Low | Medium | Very Low | Medium | Very High | High |
| **Cost (relative)** | Baseline | Baseline | Baseline | Higher | Variable* | Much Lower | Higher | Lower |
| **Time to Production** | Slow | Medium | Fast | Slow | Medium | Medium | Very Slow | Slow |
| **Flexibility** | Maximum | High | Low | Medium | Low | Medium | High | Medium |
| **Team Skill Required** | AWS APIs | Crossplane + AWS | Minimal | Abstraction concepts | AWS Fargate | vCluster + K8s | K8s ecosystem | ECS + Crossplane |
| **Best For** | Learning, debugging | Production platforms | Quick starts | Multi-cloud orgs | Serverless workloads | Dev/test density | Cloud agnostic | ECS-heavy orgs |

*Fargate costs are lower for bursty workloads, higher for steady-state

## Key Architectural Differences

### Control vs Flexibility Spectrum
- **Most Control:** Direct MRs
- **Balanced:** XRDs, K8s-Native
- **Most Opinionated:** Opinionated, Fargate

### Infrastructure Philosophy
- **Traditional Infrastructure:** Direct MRs, XRDs, Opinionated
- **Serverless/Minimal Ops:** Fargate, ECS Control Plane
- **Density/Efficiency:** vCluster
- **Portability:** Multi-Cloud, K8s-Native

### Cluster Model
- **Full EKS Clusters:** Direct MRs, XRDs, Opinionated, Multi-Cloud, K8s-Native
- **Fargate Profiles:** Fargate
- **Virtual Clusters:** vCluster
- **Hybrid:** ECS Control Plane
