# Crossplane v2 Mental Models

## Core Conceptual Shifts for Tutorial Writing

### 1. XRs Are Direct Resources (Not Accessed Via Claims)
**v2 Mental Model:**
- XRs are regular Kubernetes resources you create directly
- They live in namespaces like Deployments or Services
- Users interact with XRs directly, no abstraction layer

**Tutorial Language:**
- ✅ "Create an XR to provision your database"
- ❌ "Create a claim to request a database"

### 2. Compositions Are Function Pipelines (Not Resource Templates)
**v2 Mental Model:**
- Compositions are pipelines of functions that process requests
- Functions transform input → output, like Unix pipes
- Each function can read, modify, or create resources

**Tutorial Language:**
- ✅ "The composition pipeline processes your XR"
- ❌ "The composition template creates resources"

### 3. Everything Is Namespaced by Default
**v2 Mental Model:**
- XRs live in namespaces (unless explicitly cluster-scoped)
- MRs live in namespaces
- Namespace = security boundary + organization unit

**Tutorial Language:**
- ✅ "Your XR and its managed resources share a namespace"
- ❌ "Claims are namespaced but XRs are cluster-scoped"

### 4. Compose Any Kubernetes Resource
**v2 Mental Model:**
- XRs can create Deployments, Services, ConfigMaps directly
- No need for provider-kubernetes wrapper
- Think "Kubernetes-native composition"

**Tutorial Language:**
- ✅ "Compose applications and infrastructure together"
- ❌ "Use provider-kubernetes to create Kubernetes resources"

## Explaining Concepts at Different Levels

### High Level (Conceptual)
- "Crossplane lets you define custom APIs for your platform"
- "XRs are like custom Kubernetes resources for your domain"
- "Compositions define what happens when someone uses your API"

### Medium Level (Architectural)
- "XRs are namespaced composite resources"
- "Compositions use function pipelines to process requests"
- "Functions can create any Kubernetes resource"

### Low Level (Implementation)
- "XRD defines the OpenAPI schema for your custom resource"
- "Pipeline mode compositions call functions in sequence"
- "Functions receive desired state and return managed resources"

## Key Terminology Shifts

### Use These v2 Terms:
- **XR** (not "composite resource accessed via claim")
- **Function pipeline** (not "resource template")
- **Namespaced** (not "cluster-scoped by default")
- **Compose directly** (not "use provider-kubernetes")
- **DeploymentRuntimeConfig** (not "ControllerConfig")

### Avoid These v1 Terms:
- Claims, claimNames
- Resources mode
- "Cluster-scoped by default"
- ControllerConfig
- "Need provider-kubernetes for K8s resources"

## Tutorial Design Implications

### Learning Progression Should:
1. Start with namespaced XRs (the default)
2. Show direct XR usage (no claims)
3. Introduce Pipeline mode compositions
4. Demonstrate composing K8s + cloud resources together

### Examples Should:
- Use namespaced XRs consistently
- Show function-based compositions
- Demonstrate direct resource composition
- Use current API groups (.m.crossplane.io)

### Avoid Examples That:
- Reference claims or claimNames
- Use Resources mode
- Assume cluster-scoped resources
- Require provider-kubernetes for K8s resources

## Self-Check: Am I Thinking in v1?
**Use this to detect and correct v1 thinking patterns:**

- If I'm thinking **"claims"** → Think **"direct XRs"**
- If I'm thinking **"cluster-scoped by default"** → Think **"namespaced by default"**
- If I'm thinking **"resource templates"** → Think **"function pipelines"**
- If I'm thinking **"ControllerConfig"** → Think **"DeploymentRuntimeConfig"**
- If I'm thinking **"provider-kubernetes Objects"** → Think **"compose K8s resources directly"**
- If I'm thinking **"Resources mode"** → Think **"Pipeline mode with functions"**
- If I'm thinking **".crossplane.io APIs"** → Think **".m.crossplane.io APIs"**

**Quick self-test questions:**
- Am I using any forbidden terms from the danger checklist?
- Are my examples namespaced by default?
- Am I explaining concepts using v2 mental models?
- Would this tutorial mislead someone about v2 architecture?