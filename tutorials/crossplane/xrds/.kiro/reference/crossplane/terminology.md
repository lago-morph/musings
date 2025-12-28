# Crossplane v2 Terminology Guide

## Consistent Language for Tutorial Writing

### Core Terms (Use These)

**XR (Composite Resource)**
- Definition: A custom Kubernetes resource defined by an XRD
- Usage: "Create an XR to provision your infrastructure"
- Avoid: "Create a claim to request infrastructure"

**XRD (Composite Resource Definition)**
- Definition: Defines the API schema for a custom resource type
- Usage: "The XRD defines your custom API"
- Avoid: "The XRD defines both XRs and claims"

**Composition**
- Definition: A function pipeline that processes XR requests
- Usage: "The composition pipeline transforms your request"
- Avoid: "The composition template creates resources"

**Function Pipeline**
- Definition: A sequence of functions that process XR data
- Usage: "Functions in the pipeline transform and create resources"
- Avoid: "Resource templates with patches"

**Managed Resource (MR)**
- Definition: A Kubernetes resource representing external infrastructure
- Usage: "MRs are namespaced resources representing cloud infrastructure"
- Avoid: "MRs are cluster-scoped infrastructure resources"

### Scoping Terms

**Namespaced (Default)**
- Definition: Resources that exist within a specific namespace
- Usage: "XRs are namespaced by default in v2"
- Context: Most XRs and all MRs

**Cluster-scoped (Explicit)**
- Definition: Resources that exist cluster-wide
- Usage: "Set scope: Cluster for cluster-wide XRs"
- Context: When XRs need cluster-wide access

### Configuration Terms

**DeploymentRuntimeConfig**
- Definition: Configuration for provider deployment settings
- Usage: "Configure provider resources with DeploymentRuntimeConfig"
- Avoid: "ControllerConfig" (deprecated)

**ProviderConfig**
- Definition: Authentication and configuration for cloud providers
- Usage: "ProviderConfig contains cloud credentials"
- Context: Unchanged from v1

### Composition Terms

**Pipeline Mode**
- Definition: Composition mode using function pipelines
- Usage: "Use Pipeline mode for all v2 compositions"
- Avoid: "Resources mode" (deprecated)

**Composition Function**
- Definition: A packaged function that processes XR data
- Usage: "Install composition functions before using them"
- Context: Required for Pipeline mode

### Package Terms

**Fully Qualified Package Name**
- Definition: Package name including registry hostname
- Usage: "Always use fully qualified package names"
- Example: `xpkg.upbound.io/upbound/provider-aws-s3:v1.14.0`

**Individual Service Provider**
- Definition: Provider for a specific cloud service
- Usage: "Install individual service providers, not monolithic ones"
- Context: Upbound provider architecture

### Deprecated Terms (Avoid These)

**Claims** - Removed in v2
- Don't say: "Create a claim to request resources"
- Say instead: "Create an XR to provision resources"

**claimNames** - Field doesn't exist in v2
- Don't say: "Define claimNames in your XRD"
- Say instead: "XRDs define XR APIs directly"

**Resources Mode** - Deprecated composition mode
- Don't say: "Use Resources mode for simple compositions"
- Say instead: "Use Pipeline mode with patch-and-transform function"

**ControllerConfig** - Deprecated configuration type
- Don't say: "Configure providers with ControllerConfig"
- Say instead: "Configure providers with DeploymentRuntimeConfig"

**Cluster-scoped by default** - v1 behavior
- Don't say: "XRs are cluster-scoped by default"
- Say instead: "XRs are namespaced by default in v2"

## Explanation Patterns

### High-Level Explanations
- "Crossplane lets you create custom Kubernetes APIs for your platform"
- "XRs are like custom resources for your specific domain"
- "Compositions define what happens when someone uses your API"

### Technical Explanations
- "XRDs define OpenAPI schemas for custom resources"
- "Pipeline mode compositions use function sequences"
- "Functions receive desired state and return managed resources"

### Comparison Explanations
- "Unlike v1, XRs are namespaced and used directly"
- "Pipeline mode replaces the old Resources mode"
- "Functions provide more flexibility than static templates"

## Common Phrases to Use

### For XRs
- "Create an XR to..."
- "Your XR lives in a namespace..."
- "XRs are used directly, no claims needed..."

### For Compositions
- "The composition pipeline processes..."
- "Functions in the pipeline..."
- "Pipeline mode enables..."

### For Resources
- "Managed resources are namespaced..."
- "Resources share the XR's namespace..."
- "Compose any Kubernetes resource..."

## Common Phrases to Avoid

### v1 Terminology
- "Create a claim to request..."
- "Claims provide namespaced access..."
- "Use Resources mode for..."
- "Configure with ControllerConfig..."
- "XRs are cluster-scoped..."