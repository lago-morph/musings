---
title: "Imperitive In Declarative"
summary: "This is a great question about bridging declarative GitOps with imperative operational tasks. Here are several approaches to consider:."
keywords:
  - "workflow"
  - "argocd"
  - "yaml"
  - "database"
  - "orchestration"
  - "kubernetes"
  - "gitops"
  - "react"
category: "workflows"
categoryName: "Workflows"
weight: 4
date: "2025-12-16"
draft: false
toc: true
---

This is a great question about bridging declarative GitOps with imperative operational tasks. Here are several approaches to consider:

## 1. Custom Kubernetes Operator

Create a CRD like `DatabaseRestore` that represents the desired state:

```yaml
apiVersion: ops.example.com/v1
kind: DatabaseRestore
metadata:
  name: production-restore
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"
  database: postgres-prod
  preSteps:
    - disableIngress: true
    - scaleDeployments: 0
  postSteps:
    - scaleDeployments: auto
    - enableIngress: true
```

**Pros:**
- Most "Kubernetes-native" approach
- True declarative state - ArgoCD sees it as just another resource
- Built-in reconciliation loop handles idempotency naturally
- Can watch for changes and react automatically
- Status conditions show operation progress
- Perfect integration with GitOps workflows

**Cons:**
- Requires writing and maintaining Go code (or using kubebuilder/operator-sdk)
- More complex initial setup
- Need to handle error states, retries, and edge cases
- Learning curve for operator development

## 2. Argo Workflows + ApplicationSet

Use Argo Workflows with a custom resource that triggers workflow execution:

```yaml
apiVersion: ops.example.com/v1
kind: RestoreIntent
metadata:
  name: restore-dec-10
spec:
  backupDate: "2024-12-10"
  triggered: false  # Workflow watches this
```

A controller or the workflow itself updates `triggered: true` after execution.

**Pros:**
- Argo Workflows provides powerful orchestration
- DAG-based workflow is easy to visualize and understand
- Can reuse existing workflow templates
- Good retry and error handling built-in
- Workflow history preserved

**Cons:**
- Need coordination between workflow and state tracking
- Requires additional component (Argo Workflows)
- Idempotency logic must be built into workflow steps
- State synchronization can be tricky

## 3. Job + ConfigMap/Annotation Pattern

Use a ConfigMap to track desired state and a CronJob or controller to reconcile:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restore-state
data:
  desiredBackupTimestamp: "2024-12-10T00:00:00Z"
  lastAppliedTimestamp: "2024-12-01T00:00:00Z"
```

A Job/CronJob compares these values and executes if different.

**Pros:**
- Simple to implement - just shell scripts in a Job
- No custom code required
- Easy to understand for operators
- Lightweight solution

**Cons:**
- Less robust than operator pattern
- CronJob timing can be wasteful or delayed
- State management is manual
- No built-in reconciliation
- Harder to handle complex orchestration
- Race conditions possible

## 4. Argo CD Sync Hooks + PostSync Jobs

Use ArgoCD hooks with a resource that changes when restore is needed:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: restore-db-20241210
  annotations:
    argocd.argoproj.io/hook: Sync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
spec:
  template:
    spec:
      containers:
      - name: restore
        image: restore-tooling
        env:
        - name: BACKUP_DATE
          value: "2024-12-10"
```

**Pros:**
- Integrates directly with ArgoCD sync process
- No additional controllers needed
- Clear when operation runs (during sync)
- Hook ordering handles sequencing

**Cons:**
- Tightly coupled to ArgoCD sync cycle
- Can make syncs slow and fragile
- Not truly idempotent - reruns on every sync unless carefully designed
- Manual sync required to trigger
- Hook failures can block entire sync

## 5. Hybrid: Operator + Argo Workflows

Combine a lightweight operator that triggers Argo Workflows:

```yaml
apiVersion: ops.example.com/v1
kind: DatabaseRestore
metadata:
  name: restore-dec-10
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"
status:
  workflowName: restore-dec-10-abc123
  phase: Succeeded
```

**Pros:**
- Separates state management (operator) from execution (workflow)
- Best of both worlds for complex operations
- Clean separation of concerns
- Workflow provides detailed execution tracking

**Cons:**
- Most complex solution
- Two systems to maintain
- Requires both operator and Argo Workflows

## My Recommendation

For your use case, I'd recommend **Option 1 (Custom Operator)** or **Option 5 (Operator + Argo Workflows)** depending on complexity:

- **Start with Option 1** if your restore logic is straightforward
- **Use Option 5** if you need complex multi-step orchestration with branching logic

The operator pattern gives you true declarative state that ArgoCD can track, while the reconciliation loop naturally provides idempotency. The status subresource lets you track "this is what we wanted" vs "this is what we've done", which is exactly what you're looking for.

Would you like me to sketch out a more detailed example of any of these approaches?
