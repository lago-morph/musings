---
title: "Stage 2: Architecture Design"
summary: "Complexity Gradient: - Simplest Structure: vCluster (fewest resources per workload) - Most Transparent: Direct MRs (every resource visible) - Most Abstracted: Opinionated (user sees almost nothing) - Most Hybrid: ECS Control Plane (mixing orchestrators) Resource Count Comparison: ---. Covers Stage 2: Architecture Design, Reference Network Architecture, Management Cluster VPC Layout."
keywords:
  - "eks"
  - "aws"
  - "cloud"
  - "infrastructure"
  - "crossplane"
  - "security"
  - "mermaid"
  - "azure"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
mermaid: true
---

# Stage 2: Architecture Design

## Reference Network Architecture

### Management Cluster VPC Layout

**VPC CIDR:** `10.0.0.0/16` (65,536 IPs)

**Subnet Allocation:**
- **Public Subnet:** `10.0.0.0/22` (1,024 IPs) - Internet Gateway, NAT Gateway
- **Management Cluster Private Subnet:** `10.0.4.0/22` (1,024 IPs) - EKS control plane, worker nodes
- **Workload Cluster 1 Private Subnet:** `10.0.8.0/22` (1,024 IPs)
- **Workload Cluster 2 Private Subnet:** `10.0.12.0/22` (1,024 IPs)
- **Workload Cluster N...** continues in /22 blocks

**Key Components:**
- Single Internet Gateway for public subnet
- Single NAT Gateway in public subnet (for private subnet internet access)
- Route tables: public (IGW route), private (NAT route)
- Single AZ deployment (us-east-1a as default)

**Template Parameters:**
- `vpc_cidr` (default: 10.0.0.0/16)
- `cluster_name` (for resource naming)
- `aws_region` (default: us-east-1)
- `availability_zone` (default: us-east-1a)
- `node_instance_type` (default: t3.medium)
- `node_count` (default: 2)

---

## Management Cluster Resource Stack

### Infrastructure Resources (All Approaches Need These)

1. **VPC** - Virtual network
2. **Internet Gateway** - Public internet access
3. **Public Subnet** - /22 for NAT and public resources
4. **Private Subnet** - /22 for management cluster
5. **NAT Gateway** - Private subnet internet egress
6. **Route Tables** (2) - Public and private routing
7. **Route Table Associations** - Link subnets to route tables
8. **Security Group** - EKS cluster communication
9. **IAM Role (Cluster)** - EKS control plane permissions
10. **IAM Role (NodeGroup)** - Worker node permissions
11. **IAM Role Policy Attachments** - Required AWS managed policies
12. **EKS Cluster** - Kubernetes control plane
13. **EKS NodeGroup** - Managed worker nodes

### Crossplane-Specific Resources

14. **ProviderConfig** - AWS credentials configuration
15. **Namespace** - Organization (e.g., `crossplane-system`, `platform`)

**Total Base Resources:** ~15 distinct AWS resources

---

## Workload Cluster Template Structure

Each workload cluster follows a similar pattern but in its own /22 subnet:

**Required Template Parameters:**
- `workload_cluster_name` - Unique cluster identifier
- `workload_subnet_cidr` - The /22 block to use (e.g., 10.0.8.0/22)
- `node_instance_type` - Instance type (default: t3.medium)
- `node_count` - Number of nodes (default: 2)

**Resources Per Workload Cluster:**
1. Private Subnet (in management VPC)
2. Route Table Association (to existing private route table)
3. Security Group
4. IAM Role (Cluster)
5. IAM Role (NodeGroup)
6. IAM Role Policy Attachments
7. EKS Cluster
8. EKS NodeGroup

**Total Per Workload:** ~8 resources (reuses VPC, IGW, NAT from management)

---

## Approach-Specific Architectural Differences

**Direct MRs:**
- All 15 resources defined as individual manifests
- Manual dependency management via resource references
- Explicit configuration of every property

**XRDs:**
- Single `EKSCluster` custom resource
- Composition maps to underlying 15 resources
- Parameters expose only: cluster name, node count, instance type

**Opinionated:**
- Pre-built composition with hardcoded best practices
- Minimal parameters (often just cluster name)
- May include additional resources (monitoring, logging)

**Multi-Cloud:**
- Cloud-agnostic `KubernetesCluster` resource
- AWS-specific composition underneath
- Same interface could work with GCP/Azure compositions

**Fargate:**
- Replaces NodeGroup resources with Fargate Profile
- Removes IAM NodeGroup role
- Adds Fargate Pod Execution Role

**vCluster:**
- Management cluster is standard EKS
- Workload "clusters" become vCluster CRDs, not EKS clusters
- Dramatically simplified workload template (no VPC/IAM resources)

**K8s-Native:**
- Standard EKS infrastructure
- Adds: Harbor deployment, Vault deployment, cert-manager, NGINX Ingress controller
- Removes dependencies on ECR, Secrets Manager, ACM, ALB

**ECS Control Plane:**
- ECS Cluster instead of EKS for management plane
- ECS Task Definition for Crossplane controller
- ECS Service to run Crossplane
- Still provisions EKS for workload clusters

---

## Resource Dependency Diagrams

### Approach 1: Direct Managed Resources

```mermaid
graph TD
    subgraph "Management Cluster - Direct MRs"
        VPC[VPC 10.0.0.0/16]
        IGW[Internet Gateway]
        PubSub[Public Subnet 10.0.0.0/22]
        PrivSub[Private Subnet 10.0.4.0/22]
        NAT[NAT Gateway]
        PubRT[Public Route Table]
        PrivRT[Private Route Table]
        SG[Security Group]
        ClusterRole[IAM Role - Cluster]
        ClusterPolicies[Policy Attachments x3]
        NodeRole[IAM Role - NodeGroup]
        NodePolicies[Policy Attachments x3]
        EKS[EKS Cluster]
        NodeGroup[Managed NodeGroup]
        
        VPC --> IGW
        VPC --> PubSub
        VPC --> PrivSub
        IGW --> PubSub
        PubSub --> NAT
        PubSub --> PubRT
        PrivSub --> PrivRT
        PrivRT --> NAT
        PrivSub --> SG
        SG --> ClusterRole
        ClusterRole --> ClusterPolicies
        ClusterRole --> EKS
        EKS --> NodeRole
        NodeRole --> NodePolicies
        NodeRole --> NodeGroup
        EKS --> NodeGroup
    end
    
    subgraph "Crossplane Layer"
        PC[ProviderConfig]
        MR1[VPC Manifest]
        MR2[IGW Manifest]
        MR3[Subnet Manifests]
        MR4[Route Table Manifests]
        MR5[Security Group Manifest]
        MR6[IAM Role Manifests]
        MR7[EKS Cluster Manifest]
        MR8[NodeGroup Manifest]
        
        PC -.-> MR1
        PC -.-> MR2
        PC -.-> MR3
        PC -.-> MR4
        PC -.-> MR5
        PC -.-> MR6
        PC -.-> MR7
        PC -.-> MR8
    end
    
    style VPC fill:#e1f5ff
    style EKS fill:#ff9999
    style PC fill:#ffffcc
```

**Key Characteristics:**
- 15+ individual manifest files
- Each manifest represents one AWS resource
- Dependencies managed through resource references (e.g., `subnetIdRef`)
- Complete visibility into every resource property

---

### Approach 2: Composite Resources (XRDs)

```mermaid
graph TD
    subgraph "User Interface"
        XR[EKSCluster Custom Resource]
        Params[Parameters: name, nodeCount, instanceType]
        Params --> XR
    end
    
    subgraph "Platform Layer"
        XRD[EKSCluster XRD Definition]
        Comp[Composition]
        
        XR --> XRD
        XRD --> Comp
    end
    
    subgraph "Generated Managed Resources"
        VPC[VPC]
        IGW[Internet Gateway]
        Subnets[Subnets]
        NAT[NAT Gateway]
        RT[Route Tables]
        SG[Security Groups]
        IAM[IAM Roles + Policies]
        EKS[EKS Cluster]
        NG[NodeGroup]
        
        Comp --> VPC
        Comp --> IGW
        Comp --> Subnets
        Comp --> NAT
        Comp --> RT
        Comp --> SG
        Comp --> IAM
        Comp --> EKS
        Comp --> NG
    end
    
    subgraph "AWS Infrastructure"
        AWSVPC[AWS VPC]
        AWSEKS[AWS EKS]
        
        VPC -.-> AWSVPC
        EKS -.-> AWSEKS
    end
    
    style XR fill:#90EE90
    style Comp fill:#FFB6C1
    style EKS fill:#ff9999
```

**Key Characteristics:**
- Single custom resource exposes simplified API
- Composition template generates all 15 resources
- Platform team owns the Composition
- Users only see abstracted interface

---

### Approach 3a: Opinionated Platform

```mermaid
graph TD
    subgraph "User Interface"
        XR[PlatformCluster Resource]
        MinParams[Minimal Parameters: name only]
        MinParams --> XR
    end
    
    subgraph "Opinionated Platform Layer"
        PreBuilt[Pre-built Composition]
        Defaults[Hardcoded Best Practices]
        Security[Security Policies]
        Monitoring[Observability Stack]
        
        XR --> PreBuilt
        PreBuilt --> Defaults
        PreBuilt --> Security
        PreBuilt --> Monitoring
    end
    
    subgraph "Generated Resources"
        Infra[All AWS Infrastructure]
        CloudWatch[CloudWatch Logs]
        MetricsServer[Metrics Server]
        PSP[Pod Security Policies]
        
        PreBuilt --> Infra
        PreBuilt --> CloudWatch
        PreBuilt --> MetricsServer
        PreBuilt --> PSP
    end
    
    style XR fill:#90EE90
    style PreBuilt fill:#DDA0DD
    style Defaults fill:#F0E68C
```

**Key Characteristics:**
- Minimal user input required
- Opinionated defaults baked in
- Additional resources beyond basic infrastructure
- Limited flexibility, maximum convenience

---

### Approach 3b: Multi-Cloud Abstraction

```mermaid
graph TD
    subgraph "Cloud-Agnostic Layer"
        Generic[KubernetesCluster Resource]
        CloudParam[Parameter: cloudProvider=aws]
        CloudParam --> Generic
    end
    
    subgraph "Provider Router"
        Router[Cloud Provider Router]
        Generic --> Router
    end
    
    subgraph "AWS Implementation"
        AWSComp[AWS-Specific Composition]
        Router -->|provider=aws| AWSComp
        
        VPC[VPC]
        EKS[EKS]
        Others[Other AWS Resources]
        
        AWSComp --> VPC
        AWSComp --> EKS
        AWSComp --> Others
    end
    
    subgraph "GCP Implementation (Not Used)"
        GCPComp[GCP-Specific Composition]
        Router -.->|provider=gcp| GCPComp
        GKE[GKE]
        GCPComp -.-> GKE
    end
    
    subgraph "Azure Implementation (Not Used)"
        AzureComp[Azure-Specific Composition]
        Router -.->|provider=azure| AzureComp
        AKS[AKS]
        AzureComp -.-> AKS
    end
    
    style Generic fill:#98FB98
    style Router fill:#FFD700
    style EKS fill:#ff9999
```

**Key Characteristics:**
- Cloud-agnostic API definition
- Multiple provider-specific implementations
- Same interface across clouds
- Lowest common denominator constraints

---

### Approach 3c: Fargate-First Architecture

```mermaid
graph TD
    subgraph "Management Cluster - Fargate"
        VPC[VPC 10.0.0.0/16]
        IGW[Internet Gateway]
        PubSub[Public Subnet]
        PrivSub[Private Subnet]
        NAT[NAT Gateway]
        RT[Route Tables]
        SG[Security Groups]
        ClusterRole[IAM Role - Cluster]
        FargateRole[IAM Role - Fargate Pod Execution]
        EKS[EKS Cluster]
        FargateProfile[Fargate Profile]
        
        VPC --> IGW
        VPC --> PubSub
        VPC --> PrivSub
        PubSub --> NAT
        PrivSub --> RT
        RT --> NAT
        PrivSub --> SG
        SG --> ClusterRole
        ClusterRole --> EKS
        EKS --> FargateRole
        FargateRole --> FargateProfile
        EKS --> FargateProfile
    end
    
    subgraph "Key Differences from Standard"
        NoNodes[❌ No NodeGroup]
        NoNodeRole[❌ No NodeGroup IAM Role]
        AddFargate[✅ Fargate Profile]
        AddFargateRole[✅ Fargate Execution Role]
    end
    
    style FargateProfile fill:#9370DB
    style NoNodes fill:#FFB6C1
    style AddFargate fill:#90EE90
```

**Key Characteristics:**
- No EC2 node management
- Fargate Profile replaces NodeGroup
- Different IAM role (Pod Execution vs Node)
- Serverless compute model

---

### Approach 3d: vCluster-Based Multi-Tenancy

```mermaid
graph TD
    subgraph "Management Cluster (Standard EKS)"
        VPC[VPC]
        EKS[EKS Cluster]
        NodeGroup[NodeGroup]
        
        VPC --> EKS
        EKS --> NodeGroup
    end
    
    subgraph "vCluster Operator"
        VCOperator[vCluster Controller]
        NodeGroup --> VCOperator
    end
    
    subgraph "Virtual Clusters (Not Real EKS)"
        VC1[vCluster 1]
        VC2[vCluster 2]
        VC3[vCluster 3]
        VCN[vCluster N...]
        
        VCOperator --> VC1
        VCOperator --> VC2
        VCOperator --> VC3
        VCOperator --> VCN
    end
    
    subgraph "Shared Infrastructure"
        SharedNodes[Shared Worker Nodes]
        SharedNetwork[Shared Networking]
        SharedStorage[Shared Storage]
        
        NodeGroup -.-> SharedNodes
        VPC -.-> SharedNetwork
        SharedNodes -.-> SharedStorage
        
        VC1 -.-> SharedNodes
        VC2 -.-> SharedNodes
        VC3 -.-> SharedNodes
    end
    
    style EKS fill:#ff9999
    style VC1 fill:#87CEEB
    style VC2 fill:#87CEEB
    style VC3 fill:#87CEEB
    style VCN fill:#87CEEB
```

**Key Characteristics:**
- One real EKS cluster (management)
- Multiple virtual clusters running as pods
- Workload "clusters" are not separate EKS clusters
- Massive cost savings, shared infrastructure

**Workload Cluster Comparison:**

```mermaid
graph LR
    subgraph "Standard Approach"
        S1[Workload needs 8 AWS resources]
        S2[Full EKS cluster]
        S3[Dedicated infrastructure]
        S1 --> S2 --> S3
    end
    
    subgraph "vCluster Approach"
        V1[Workload needs 1 resource]
        V2[vCluster CRD]
        V3[Runs as pods in host]
        V1 --> V2 --> V3
    end
    
    style S2 fill:#FFB6C1
    style V2 fill:#90EE90
```

---

### Approach 3e: Kubernetes-Native Tooling

```mermaid
graph TD
    subgraph "Standard EKS Infrastructure"
        VPC[VPC]
        EKS[EKS Cluster]
        NodeGroup[NodeGroup]
        
        VPC --> EKS
        EKS --> NodeGroup
    end
    
    subgraph "K8s-Native Services (Instead of AWS)"
        Vault[Vault - Secrets]
        Harbor[Harbor - Container Registry]
        CertManager[cert-manager - Certificates]
        Nginx[NGINX Ingress - Load Balancing]
        ExternalDNS[external-dns - DNS]
        
        NodeGroup --> Vault
        NodeGroup --> Harbor
        NodeGroup --> CertManager
        NodeGroup --> Nginx
        NodeGroup --> ExternalDNS
    end
    
    subgraph "Minimal AWS Services"
        Route53[Route53 - DNS only]
        S3[S3 - Harbor backend]
        
        ExternalDNS -.-> Route53
        Harbor -.-> S3
    end
    
    subgraph "Replaced AWS Services"
        NoASM[❌ Secrets Manager]
        NoECR[❌ ECR]
        NoACM[❌ Certificate Manager]
        NoALB[❌ ALB Controller]
    end
    
    style Vault fill:#90EE90
    style Harbor fill:#90EE90
    style CertManager fill:#90EE90
    style Nginx fill:#90EE90
    style NoASM fill:#FFB6C1
    style NoECR fill:#FFB6C1
```

**Key Characteristics:**
- Standard EKS infrastructure
- Cloud-agnostic tooling for services
- Additional operational complexity
- Higher resource requirements
- Better cloud portability

---

### Approach 3f: ECS Control Plane Alternative

```mermaid
graph TD
    subgraph "Management Control Plane (ECS)"
        VPC[VPC]
        ECSCluster[ECS Cluster]
        TaskDef[Task Definition - Crossplane]
        ECSService[ECS Service]
        FargateTask[Fargate Task - Running Crossplane]
        
        VPC --> ECSCluster
        ECSCluster --> TaskDef
        TaskDef --> ECSService
        ECSService --> FargateTask
    end
    
    subgraph "Crossplane in ECS"
        XPController[Crossplane Controller]
        Providers[AWS Providers]
        
        FargateTask --> XPController
        XPController --> Providers
    end
    
    subgraph "Provisioned Workload Clusters (EKS)"
        WL1[EKS Workload Cluster 1]
        WL2[EKS Workload Cluster 2]
        
        Providers --> WL1
        Providers --> WL2
    end
    
    subgraph "Hybrid Model"
        ManagementECS[Management = ECS]
        WorkloadEKS[Workloads = EKS]
    end
    
    style ECSCluster fill:#FFA500
    style WL1 fill:#ff9999
    style WL2 fill:#ff9999
    style ManagementECS fill:#FFD700
    style WorkloadEKS fill:#87CEEB
```

**Key Characteristics:**
- Management plane on ECS (not Kubernetes)
- Crossplane runs as ECS task
- Provisions standard EKS workload clusters
- Unusual architecture, limited community patterns

---

## Diagram Comparison Summary

**Complexity Gradient:**
- **Simplest Structure:** vCluster (fewest resources per workload)
- **Most Transparent:** Direct MRs (every resource visible)
- **Most Abstracted:** Opinionated (user sees almost nothing)
- **Most Hybrid:** ECS Control Plane (mixing orchestrators)

**Resource Count Comparison:**

| Approach | Mgmt Cluster Resources | Per Workload Resources |
|----------|------------------------|------------------------|
| Direct MRs | 15 individual MRs | 8 MRs |
| XRDs | 1 XR + 1 Composition | 1 XR |
| Opinionated | 1 XR | 1 XR |
| Multi-Cloud | 1 Generic XR | 1 Generic XR |
| Fargate | 14 MRs (no NodeGroup) | 7 MRs |
| vCluster | 15 MRs + vCluster Op | 1 vCluster CRD |
| K8s-Native | 15 MRs + 5 apps | 8 MRs |
| ECS Control | ECS Task + resources | 8 EKS MRs |

---

## Stage 2 Complete

This architecture design provides the foundation for understanding how each approach structures and organizes resources. The diagrams illustrate the fundamental differences in complexity, abstraction levels, and architectural patterns across all approaches.
