---
title: "Shell script helper for Option 3"
summary: "Great question - this is smart architectural thinking. You want to avoid painting yourself into a corner. Here's how to abstract it:."
keywords:
  - "crossplane"
  - "database"
  - "api"
  - "yaml"
  - "function"
  - "deployment"
  - "container"
  - "python"
category: "devplatform"
categoryName: "Development Platforms"
weight: 2
date: "2025-12-16"
draft: false
toc: true
---

Great question - this is smart architectural thinking. You want to avoid painting yourself into a corner. Here's how to abstract it:

## The Key Abstraction: Separate Intent from Implementation

The core idea is to define a **stable interface** (the "what") that both solutions can implement, keeping the "how" hidden.

## Step 1: Define Your State Schema

Create a clear contract for what restore state looks like. Use a ConfigMap or CRD that both solutions can work with:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: database-restore-state
  labels:
    app.kubernetes.io/managed-by: restore-system
    app.kubernetes.io/component: state
data:
  # The "API" - don't change these field names
  desiredBackupTimestamp: "2024-12-10T00:00:00Z"
  targetDatabase: "postgres-prod"
  targetDeployments: "myapp,worker,api"
  
  # Implementation details - these can change
  lastAppliedBackupTimestamp: "2024-12-01T00:00:00Z"
  operationPhase: "Complete"
  operationId: "restore-20241210-001"
  message: "Restore completed successfully"
```

**OR** (better) - create a minimal CRD now that Crossplane can adopt later:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databaserestores.ops.example.com
spec:
  group: ops.example.com
  names:
    kind: DatabaseRestore
    plural: databaserestores
  scope: Namespaced
  versions:
  - name: v1alpha1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: [backupTimestamp, database]
            properties:
              backupTimestamp:
                type: string
                format: date-time
              database:
                type: string
              deployments:
                type: array
                items:
                  type: string
              ingressesToDisable:
                type: array
                items:
                  type: string
          status:
            type: object
            properties:
              phase:
                type: string
                enum: [Pending, InProgress, Complete, Failed]
              lastAppliedBackup:
                type: string
              operationId:
                type: string
              message:
                type: string
              startTime:
                type: string
              completionTime:
                type: string
    subresources:
      status: {}
```

This CRD is Crossplane-compatible but doesn't require Crossplane yet.

## Step 2: Standardized Status Updates

Both implementations must update status the same way:

```bash
# Shell script helper for Option 3
update_status() {
  local phase=$1
  local message=$2
  
  kubectl patch databaserestore $RESTORE_NAME \
    --type=merge \
    --subresource=status \
    -p "{
      \"status\": {
        \"phase\": \"$phase\",
        \"message\": \"$message\",
        \"lastUpdated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }
    }"
}

# Usage
update_status "InProgress" "Disabling ingress..."
```

Later, your Crossplane function updates the same fields:

```python
def compose(request):
    # ...
    return response(
        status={
            "phase": "InProgress",
            "message": "Disabling ingress...",
            "lastUpdated": now()
        }
    )
```

## Step 3: Modular Implementation Scripts

Put all your actual restore logic in a separate container image/scripts that both solutions can call:

```
restore-scripts/
├── common.sh              # Shared utilities
├── pre-restore.sh         # Disable ingress, scale down
├── restore.sh             # Actual backup restore
├── post-restore.sh        # Scale up, enable ingress
└── rollback.sh            # Emergency rollback
```

**Option 3 controller** calls these:
```bash
#!/bin/bash
source /scripts/common.sh

DESIRED=$(kubectl get databaserestore $NAME -o jsonpath='{.spec.backupTimestamp}')
APPLIED=$(kubectl get databaserestore $NAME -o jsonpath='{.status.lastAppliedBackup}')

if [ "$DESIRED" != "$APPLIED" ]; then
  update_status "InProgress" "Starting restore"
  
  /scripts/pre-restore.sh "$NAME" || exit 1
  /scripts/restore.sh "$DESIRED" || exit 1
  /scripts/post-restore.sh "$NAME" || exit 1
  
  update_status "Complete" "Restore finished"
  kubectl patch databaserestore $NAME --subresource=status --type=merge \
    -p "{\"status\": {\"lastAppliedBackup\": \"$DESIRED\"}}"
fi
```

**Crossplane function** calls the same scripts:
```python
def compose(request):
    spec = request.observed.composite.spec
    status = request.observed.composite.status
    
    if spec.backupTimestamp == status.get('lastAppliedBackup'):
        return response()  # Already applied
    
    # Generate Job that runs the same scripts
    restore_job = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {"name": f"restore-{spec.backupTimestamp}"},
        "spec": {
            "template": {
                "spec": {
                    "containers": [{
                        "name": "restore",
                        "image": "your-restore-scripts:v1",  # Same image!
                        "command": ["/scripts/restore.sh", spec.backupTimestamp]
                    }]
                }
            }
        }
    }
    
    return response(resources=[restore_job])
```

## Step 4: Version Your "API"

Add annotations to track what's managing it:

```yaml
apiVersion: ops.example.com/v1alpha1
kind: DatabaseRestore
metadata:
  name: prod-restore
  annotations:
    ops.example.com/controller-version: "v1-bash"  # or "v2-crossplane"
    ops.example.com/schema-version: "v1alpha1"
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"
  database: postgres-prod
```

This lets you:
- Run both controllers simultaneously during migration
- Have them ignore resources not meant for them
- Track which system handled which restore

## Step 5: Abstract the Controller Detection

Both implementations watch the same resource but check if they should handle it:

**Option 3:**
```bash
should_handle() {
  local version=$(kubectl get databaserestore $NAME \
    -o jsonpath='{.metadata.annotations.ops\.example\.com/controller-version}')
  
  # Handle if no version set (default) or explicitly v1-bash
  if [ -z "$version" ] || [ "$version" = "v1-bash" ]; then
    return 0
  fi
  return 1
}
```

**Crossplane function:**
```python
def should_handle(resource):
    version = resource.metadata.annotations.get(
        'ops.example.com/controller-version', 'v2-crossplane'
    )
    return version == 'v2-crossplane'
```

## Migration Path

### Phase 1: Start with Option 3
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: restore-controller-v1
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: controller
        image: restore-controller:v1-bash
        env:
        - name: CONTROLLER_VERSION
          value: "v1-bash"
```

### Phase 2: Deploy Crossplane (No Changes Yet)
```bash
# Install Crossplane
helm install crossplane --namespace crossplane-system \
  crossplane-stable/crossplane

# Your Option 3 controller still handles everything
```

### Phase 3: Create Crossplane XRD (Matches Your CRD)
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
  # IMPORTANT: Make it a "claim" for existing CRD
  claimNames:
    kind: DatabaseRestore  # Same as your existing CRD!
    plural: databaserestores
  versions:
  - name: v1alpha1  # Same version!
    schema:
      # Same schema as your CRD
```

### Phase 4: Deploy Composition Function (Handles Only New Resources)
```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: database-restore-v2
  labels:
    crossplane.io/xrd: xdatabaserestores.ops.example.com
spec:
  compositeTypeRef:
    apiVersion: ops.example.com/v1alpha1
    kind: XDatabaseRestore
  mode: Pipeline
  pipeline:
  - step: restore
    functionRef:
      name: function-restore-v2
```

Now you can test Crossplane with new resources:
```yaml
apiVersion: ops.example.com/v1alpha1
kind: DatabaseRestore
metadata:
  name: test-restore
  annotations:
    ops.example.com/controller-version: "v2-crossplane"  # Route to Crossplane
spec:
  backupTimestamp: "2024-12-11T00:00:00Z"
```

### Phase 5: Gradual Migration
```bash
# Migrate one resource at a time
kubectl annotate databaserestore prod-restore \
  ops.example.com/controller-version=v2-crossplane

# Or migrate all at once
kubectl annotate databaserestore --all \
  ops.example.com/controller-version=v2-crossplane
```

### Phase 6: Decommission Option 3
```bash
# Scale down old controller
kubectl scale deployment restore-controller-v1 --replicas=0

# Monitor for a week, then delete
kubectl delete deployment restore-controller-v1
```

## Key Abstraction Points

1. **Resource schema** - Same CRD/spec for both
2. **Status contract** - Both update `.status` identically  
3. **Implementation scripts** - Shared container image
4. **Controller selection** - Annotation-based routing
5. **Observability** - Both emit same events/metrics

## File Structure for Clean Separation

```
restore-system/
├── crd/
│   └── databaserestore-crd.yaml         # Shared CRD definition
├── option3/
│   ├── deployment.yaml                   # Bash controller
│   ├── controller.sh                     # Main loop
│   └── Dockerfile
├── crossplane/
│   ├── xrd.yaml                          # XRD (references same CRD)
│   ├── composition.yaml
│   └── function/
│       ├── fn.py                         # Composition function
│       └── Dockerfile
└── scripts/                              # Shared by both!
    ├── common.sh
    ├── pre-restore.sh
    ├── restore.sh
    └── post-restore.sh
```

## Testing the Abstraction

You can test both simultaneously:

```yaml
# Test Option 3
apiVersion: ops.example.com/v1alpha1
kind: DatabaseRestore
metadata:
  name: test-bash
  annotations:
    ops.example.com/controller-version: "v1-bash"
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"

---
# Test Crossplane (same API!)
apiVersion: ops.example.com/v1alpha1
kind: DatabaseRestore
metadata:
  name: test-crossplane
  annotations:
    ops.example.com/controller-version: "v2-crossplane"
spec:
  backupTimestamp: "2024-12-10T00:00:00Z"
```

Both use the same spec format, update status the same way, and call the same restore scripts. The only difference is which controller handles the reconciliation.

This approach gives you a clean migration path with no big-bang rewrite required. Does this abstraction strategy work for your needs?
