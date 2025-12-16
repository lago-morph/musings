---
title: "Pseudocode for composition function"
summary: "Crossplane v2 opens up some very elegant solutions for this use case. Let me explain the key differences and how they apply."
keywords:
  - "function"
  - "crossplane"
  - "yaml"
  - "kubernetes"
  - "helm"
  - "python"
  - "argocd"
  - "gitops"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

Yes! Crossplane v2 opens up some very elegant solutions for this use case. Let me explain the key differences and how they apply.

## Key Crossplane v2 Improvements Relevant Here

**Crossplane v2 introduces:**

1. **Composition Functions (replacing Patch & Transform)** - Write composition logic in real programming languages (Go, Python, etc.) instead of YAML patches
2. **Better lifecycle management** - More control over resource ordering and dependencies
3. **Improved status handling** - Better state tracking and conditions
4. **Function pipelines** - Chain multiple functions together for complex workflows

## Solution 1: Custom XRD with Composition Function

This is probably the cleanest approach. Define a Custom Resource (XRD) that represents your restore intent:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabaserestores.ops.example.com
spec:
  group: ops.example.com
  names:
    kind: XDatabaseRestore
    plural: xdatabaserestores
  claimNames:
    kind: DatabaseRestore
    plural: databaserestores
  versions:
  - name: v1alpha1
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              backupTimestamp:
                type: string
              databaseRef:
                type: string
              targetDeployments:
                type: array
                items:
                  type: string
          status:
            type: object
            properties:
              phase:
                type: string
              lastAppliedBackup:
                type: string
              operationStarted:
                type: string
```

Then create a **Composition Function** (in Go, Python, etc.) that:

```python
# Pseudocode for composition function
def compose(request):
    desired = request.observed.composite.spec.backupTimestamp
    applied = request.observed.composite.status.lastAppliedBackup
    
    if desired == applied:
        # Nothing to do, already in desired state
        return response(resources=[])
    
    phase = request.observed.composite.status.phase
    
    if phase == "Complete":
        # Start new operation
        return response(resources=[
            disable_ingress_patch(),
            scale_deployments_to_zero(),
            restore_job(desired),
        ], status={"phase": "InProgress"})
    
    elif phase == "InProgress":
        # Check if job completed
        job_status = get_job_status(request)
        if job_status == "Succeeded":
            return response(resources=[
                restore_deployments(),
                enable_ingress(),
            ], status={
                "phase": "Complete",
                "lastAppliedBackup": desired
            })
    
    return response()
```

**Usage in Git:**
```yaml
apiVersion: ops.example.com/v1alpha1
kind: DatabaseRestore
metadata:
  name: prod-restore
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"
  databaseRef: postgres-prod
  targetDeployments:
    - myapp
    - worker
```

### Pros:
- **Truly declarative** - GitOps-friendly, ArgoCD sees it as just another resource
- **Full programming language** - Complex logic, error handling, retries in Python/Go
- **Built-in reconciliation** - Crossplane reconciles automatically
- **Idempotent by design** - Composition functions are pure functions of desired state
- **Rich status reporting** - Can track detailed progress in `.status`
- **Works without ArgoCD** - Just needs Crossplane
- **Clean separation** - Business logic in function, state in cluster

### Cons:
- Requires writing a composition function (but simpler than a full operator)
- Need to package and deploy the function
- Learning curve for Crossplane v2 function model

## Solution 2: Provider-Kubernetes with Job Orchestration

Use Crossplane's Provider-Kubernetes (which can manage any Kubernetes resources) with a structured approach:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-restore-workflow
spec:
  compositeTypeRef:
    apiVersion: ops.example.com/v1alpha1
    kind: XDatabaseRestore
  mode: Pipeline
  pipeline:
  - step: check-state
    functionRef:
      name: function-check-restore-state
  - step: create-prereq-resources
    functionRef:
      name: function-conditional-resources
  - step: create-restore-job
    functionRef:
      name: function-restore-job
  - step: create-postreq-resources
    functionRef:
      name: function-cleanup-resources
```

Each function can conditionally create Kubernetes resources based on state:

```yaml
# Function output creates these only when needed
- apiVersion: kubernetes.crossplane.io/v1alpha1
  kind: Object
  spec:
    forProvider:
      manifest:
        apiVersion: batch/v1
        kind: Job
        metadata:
          name: restore-db-20241210
          annotations:
            restore.ops/timestamp: "2024-12-10T00:00:00Z"
```

### Pros:
- Leverages Provider-Kubernetes for actual resource management
- Pipeline model makes sequencing clear
- Each function can be simple and focused
- Can conditionally create/skip resources based on state

### Cons:
- Still requires writing functions
- Provider-Kubernetes adds another layer
- State tracking across pipeline steps needs careful design

## Solution 3: Crossplane + ProviderConfig with External System

If you have an external job orchestration system (even something simple), use Crossplane to manage the "intent" and let external system do work:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabaserestores.ops.example.com
# ... XRD definition ...

---
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
spec:
  resources:
  - name: restore-trigger
    base:
      apiVersion: kubernetes.crossplane.io/v1alpha2
      kind: Object
      spec:
        forProvider:
          manifest:
            apiVersion: v1
            kind: ConfigMap
            metadata:
              name: restore-intent
            data:
              backupTimestamp: "" # Patched from XR
              state: "pending"
```

Then your Option 3 controller watches for this ConfigMap and does the work, updating the state back.

### Pros:
- Combines Crossplane's declarative model with your simpler controller
- Can reuse existing tooling
- Clear separation: Crossplane = state management, controller = execution
- Easier than full composition function for simple cases

### Cons:
- Two systems to coordinate
- Not as "pure" as function-based approach
- Still need the controller logic

## Solution 4: Crossplane with Provider-Helm for Jobs

Use Provider-Helm to deploy Helm charts that include Jobs:

```yaml
apiVersion: helm.crossplane.io/v1beta1
kind: Release
metadata:
  name: database-restore-20241210
spec:
  forProvider:
    chart:
      name: database-restore
      repository: https://charts.example.com
    values:
      backupTimestamp: "2024-12-10T00:00:00Z"
      onlyIfChanged: true
    # Crossplane tracks if values changed, only upgrades if needed
```

The Helm chart contains Jobs with idempotent scripts.

### Pros:
- Simple if you already use Helm
- Helm's release tracking provides some state management
- Can package restore logic in a chart

### Cons:
- Helm isn't really designed for operational workflows
- Less elegant than purpose-built solution
- State tracking still manual within the chart

## My Recommendation for Crossplane v2

**Start with Solution 1: Custom XRD + Composition Function**

Here's why it's cleanest:

1. **True GitOps** - Your git repo has:
   ```yaml
   apiVersion: ops.example.com/v1alpha1
   kind: DatabaseRestore
   metadata:
     name: prod-restore
   spec:
     backupTimestamp: "2024-12-10T00:00:00Z"
   ```
   That's it. Clean, declarative, obvious.

2. **Composition function handles complexity** - All the imperative "how" lives in code, not YAML. You write proper error handling, logging, state machines in a real language.

3. **Crossplane does reconciliation** - You don't write a controller loop. Crossplane handles watching, reconciling, retrying.

4. **Status is built-in** - `.status` field shows exactly what happened:
   ```yaml
   status:
     phase: Complete
     lastAppliedBackup: "2024-12-10T00:00:00Z"
     operationStarted: "2024-12-11T10:00:00Z"
     operationCompleted: "2024-12-11T10:15:00Z"
   ```

5. **Idempotent by design** - Function receives current state, returns desired resources. Crossplane ensures idempotency.

6. **Works everywhere** - With or without ArgoCD. Just needs Crossplane.

## Quick Comparison to Option 3

| Aspect | Option 3 (Deployment + ConfigMap) | Crossplane XRD + Function |
|--------|-----------------------------------|---------------------------|
| Reconciliation | Manual (polling loop) | Automatic (Crossplane) |
| Language | Bash scripts | Python/Go |
| State tracking | Manual in ConfigMap | Built-in `.status` |
| Idempotency | Manual implementation | Framework-provided |
| GitOps | Works, but hacky | First-class |
| Learning curve | Low | Medium |
| Maintainability | Scripts get messy | Structured code |

The composition function approach is "just enough" structure without being a full operator. You get 95% of operator benefits with maybe 30% of the work.

Would you like me to show a more concrete example of a composition function for this use case?
