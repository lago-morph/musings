---
title: "Read current state AND capture resourceVersion"
summary: "Good choice - Option 3 is pragmatic and you can iterate quickly. Let me expand on it."
keywords:
  - "deployment"
  - "yaml"
  - "observability"
  - "workflow"
  - "argocd"
  - "orchestration"
  - "kubernetes"
  - "monitoring"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

Good choice - Option 3 is pragmatic and you can iterate quickly. Let me expand on it.

## How Option 3 Works in Practice

The basic idea is you commit a ConfigMap (or annotation on an existing resource) that represents "desired state". A controller mechanism (CronJob, or better - a simple Deployment with a watch loop) continuously checks if `desiredState != appliedState` and executes the restore workflow when they differ.

## Detailed Look at the Cons

### 1. **Less robust than operator pattern**
The reconciliation logic lives in shell scripts or simple programs rather than a proper controller framework. This means:
- No automatic retry with exponential backoff
- Less structured error handling
- No queuing of work items
- Harder to ensure exactly-once semantics

### 2. **CronJob timing issues**
If using CronJob:
- Might run every 5 minutes but change happened 4 minutes ago = 4 minute delay
- Or runs every minute = wasteful, checking state 1,439 times when nothing changed
- No immediate reaction to git changes

### 3. **State management is manual**
You need to explicitly:
- Read current state from cluster
- Compare with desired state  
- Update "last applied" after success
- Handle partial failures (what if ingress disabled but restore failed?)

### 4. **No built-in reconciliation**
Unlike operators, nothing watches the ConfigMap for changes. You're polling, not reacting.

### 5. **Race conditions**
If multiple instances run (CronJob overlap, manual trigger + CronJob), they might:
- Both start restoring simultaneously
- Overwrite each other's state updates
- Leave system in inconsistent state

### 6. **Complex orchestration is harder**
Multi-step workflows with dependencies, rollbacks, conditional logic becomes spaghetti in bash.

## Strategies to Minimize Drawbacks

### Use a Deployment with Watch Loop Instead of CronJob

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: restore-controller
spec:
  replicas: 1  # Important: only 1
  template:
    spec:
      serviceAccountName: restore-controller
      containers:
      - name: controller
        image: your-controller:latest
        command: ["/bin/controller-loop.sh"]
```

The script does:
```bash
while true; do
  kubectl wait --for=condition=ready configmap/restore-state --timeout=60s
  check_and_reconcile
  sleep 30
done
```

**Benefits over CronJob:**
- Continuous running, faster reaction time
- `replicas: 1` prevents race conditions
- Can use `kubectl wait` for event-driven approach
- Still simple, no operator framework needed

### Use Optimistic Locking with Resource Versions

```bash
# Read current state AND capture resourceVersion
CURRENT_RV=$(kubectl get cm restore-state -o jsonpath='{.metadata.resourceVersion}')
DESIRED=$(kubectl get cm restore-state -o jsonpath='{.data.desiredBackupTimestamp}')
APPLIED=$(kubectl get cm restore-state -o jsonpath='{.data.lastAppliedTimestamp}')

if [ "$DESIRED" != "$APPLIED" ]; then
  # Do the restore work...
  
  # Update with resourceVersion check - fails if someone else modified
  kubectl patch cm restore-state \
    --type=json \
    -p="[{\"op\": \"replace\", \"path\": \"/data/lastAppliedTimestamp\", \"value\": \"$DESIRED\"}]" \
    --resource-version="$CURRENT_RV"
fi
```

**Benefits:**
- Prevents race conditions via optimistic locking
- Atomic state updates
- Clear failure signal if collision occurs

### Add Lease-Based Locking

Use Kubernetes Lease objects for distributed locking:

```bash
# Try to acquire lease
kubectl create -f - <<EOF || exit 0
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: restore-operation-lock
spec:
  holderIdentity: "$POD_NAME"
  leaseDurationSeconds: 600
EOF

# Do work...

# Release lease
kubectl delete lease restore-operation-lock
```

**Benefits:**
- Multiple instances can safely coexist
- Only one actually does work
- Automatic timeout if pod crashes

### State Machine in ConfigMap

Track not just desired/applied, but also intermediate states:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restore-state
data:
  desiredBackupTimestamp: "2024-12-10T00:00:00Z"
  lastAppliedTimestamp: "2024-12-01T00:00:00Z"
  operationPhase: "Complete"  # Idle|InProgress|Failed|Complete
  operationStarted: ""
  operationCompleted: "2024-12-01T00:05:00Z"
  preStepCompleted: ""  # Track granular progress
  restoreCompleted: ""
  postStepCompleted: ""
```

Controller logic:
```bash
case "$PHASE" in
  "Idle"|"Complete"|"Failed")
    if [ "$DESIRED" != "$APPLIED" ]; then
      start_new_operation
    fi
    ;;
  "InProgress")
    # Check if stale (started >1hr ago) -> mark Failed
    # Otherwise, skip (already running)
    ;;
esac
```

**Benefits:**
- Idempotent: can resume from any step
- Visible progress in git/cluster
- Can detect stuck operations
- Clear state transitions

### Use Annotations for Immutability

Instead of updating ConfigMap, create new ones:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restore-intent-20241210  # Date in name
  labels:
    app: restore-controller
    applied: "false"
data:
  backupTimestamp: "2024-12-10T00:00:00Z"
```

Controller watches for `applied: "false"`, processes, then labels it `applied: "true"`.

**Benefits:**
- Full audit history in git
- No state synchronization issues
- ArgoCD shows clear diff
- Easy rollback (just change which ConfigMap exists)

**Drawback:**
- More ConfigMaps to manage over time (need cleanup policy)

### Structured Logging and Status Tracking

Write detailed status to a separate ConfigMap or as events:

```bash
kubectl create event restore-operation \
  --type=Normal \
  --reason=RestoreStarted \
  --message="Starting restore from 2024-12-10"

# Or update status ConfigMap
kubectl patch cm restore-status --type=merge -p '{
  "data": {
    "lastOperation": "'"$(date -Iseconds)"'",
    "lastStatus": "InProgress",
    "message": "Disabling ingress..."
  }
}'
```

**Benefits:**
- Observability without logs diving
- Can integrate with monitoring/alerting
- Clear operational history

### Make Scripts Truly Idempotent

Each step should check before acting:

```bash
disable_ingress() {
  local current=$(kubectl get ingress myapp -o jsonpath='{.metadata.annotations.disabled}')
  if [ "$current" = "true" ]; then
    echo "Ingress already disabled, skipping"
    return 0
  fi
  kubectl annotate ingress myapp disabled=true
  kubectl delete ingress myapp
}

scale_to_zero() {
  local replicas=$(kubectl get deploy myapp -o jsonpath='{.spec.replicas}')
  if [ "$replicas" = "0" ]; then
    echo "Already scaled to zero"
    return 0
  fi
  # Save original count
  kubectl annotate deploy myapp original-replicas="$replicas"
  kubectl scale deploy myapp --replicas=0
}
```

**Benefits:**
- Safe to run multiple times
- Can resume from any point
- No duplicate work

## Recommended Hybrid Approach

Combine several of these:

1. **Deployment (not CronJob)** - faster reaction, prevents overlaps via `replicas: 1`
2. **State machine in ConfigMap** - track progress, handle failures
3. **Lease-based locking** - extra safety if you need >1 replica for HA
4. **Idempotent steps** - each operation checks before acting
5. **Status tracking** - separate ConfigMap or events for observability

This gives you 80% of the operator benefits with 20% of the complexity, works great without ArgoCD, and you can test everything locally with kind/minikube.

The main remaining limitation versus a real operator: no automatic watch/event-driven reaction (you're still polling every 30-60s), but that's acceptable for DR operations that aren't time-critical down to the second.

Would you like me to sketch out a concrete example implementation of this hybrid approach?
