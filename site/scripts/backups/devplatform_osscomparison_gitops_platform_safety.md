# GitOps Safety Architecture for Platform Evolution

This is the **#1 problem** that kills platform adoption. You're absolutely right—one bad XRD or Promise can destroy trust instantly. Here's the battle-tested approach:

## **The Core Problem**

```
Developer requests database via Kratix Promise
    ↓
You update the Promise to add new features
    ↓
Crossplane reconciles ALL existing databases
    ↓
Bug in new Composition = 50 databases get recreated
    ↓
Developers lose data, platform team loses credibility
```

---

## **Architecture 1: The Platform-as-Layers Model**

### Repository Structure

```
platform-infra/                    # REPO 1: Platform Team owns
├── bootstrap/
│   └── argocd-root.yaml          # The one true root
├── core-platform/                 # Tier 0: Never changes
│   ├── crossplane/
│   │   └── crossplane-install.yaml
│   ├── kratix/
│   │   └── kratix-install.yaml
│   └── argocd/
│       └── argocd-config.yaml
├── platform-capabilities/         # Tier 1: Changes carefully
│   ├── stable/                    # Production Promises/XRDs
│   │   ├── postgres-v1/
│   │   │   ├── xrd.yaml
│   │   │   ├── composition-prod.yaml
│   │   │   └── composition-dev.yaml
│   │   └── s3-bucket-v1/
│   └── beta/                      # Testing new versions
│       └── postgres-v2/
│           ├── xrd.yaml
│           └── composition.yaml
└── workload-instances/            # Tier 2: Developer requests
    └── team-a/
        └── payment-db-claim.yaml

platform-dev/                      # REPO 2: Sandbox for platform team
└── experimental/
    └── postgres-v3-experimental/  # Break things here safely
```

### ArgoCD Application Hierarchy

```yaml
# bootstrap/argocd-root.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-root
  namespace: argocd
spec:
  project: platform
  source:
    repoURL: https://github.com/org/platform-infra
    path: bootstrap/apps
  destination:
    server: https://kubernetes.default.svc
  syncPolicy:
    automated:
      prune: false      # NEVER auto-prune the root!
      selfHeal: false   # Manual sync only
```

```yaml
# bootstrap/apps/core-platform.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: core-platform
spec:
  syncPolicy:
    automated:
      prune: false      # Core infra = manual changes only
      selfHeal: true    # Fix drift, but don't delete
    syncOptions:
    - CreateNamespace=true
```

```yaml
# bootstrap/apps/stable-capabilities.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: stable-capabilities
spec:
  syncPolicy:
    automated:
      prune: true       # Safe to prune old versions
      selfHeal: true
    syncOptions:
    - RespectIgnoreDifferences=true
  ignoreDifferences:
  - group: apiextensions.crossplane.io
    kind: CompositeResourceDefinition
    jsonPointers:
    - /status              # Ignore status changes
  - group: platform.kratix.io
    kind: Promise
    managedFieldsManagers:
    - kratix              # Let Kratix manage its fields
```

**Key insight:** Different sync policies for different tiers. Core = manual, capabilities = automated but careful, workloads = fully automated.

---

## **Architecture 2: Immutable Versioned Capabilities**

### The Versioning Strategy

```yaml
# DON'T DO THIS - Breaks existing claims when you update
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresdatabases.platform.example.com  # Collision!
```

```yaml
# DO THIS - New versions coexist with old
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresdatabases.platform.example.com
spec:
  group: platform.example.com
  names:
    kind: XPostgresDatabase
    plural: xpostgresdatabases
  claimNames:
    kind: PostgresDatabase
    plural: postgresdatabases
  versions:
  - name: v1alpha1          # Old version - keep supporting
    served: true
    referenceable: true
    schema: {...}
  - name: v1beta1           # New version - opt-in
    served: true
    referenceable: true
    schema:
      # New features here
      properties:
        spec:
          properties:
            version:        # New field
              type: string
            backupSchedule: # New field
              type: string
```

### Composition Selection Strategy

```yaml
# Composition for v1alpha1 (old claims use this)
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: postgres.platform.example.com.v1alpha1
  labels:
    crossplane.io/xrd: xpostgresdatabases.platform.example.com
    provider: aws
    version: v1alpha1       # Explicit version label
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1alpha1
    kind: XPostgresDatabase
  # ... existing composition logic
```

```yaml
# New composition for v1beta1
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: postgres.platform.example.com.v1beta1
  labels:
    crossplane.io/xrd: xpostgresdatabases.platform.example.com
    provider: aws
    version: v1beta1
spec:
  compositeTypeRef:
    apiVersion: platform.example.com/v1beta1  # Points to new version
    kind: XPostgresDatabase
  # ... new improved composition
```

**Key insight:** Old claims keep using old Compositions. They don't break when you add v1beta1.

---

## **Architecture 3: Blast Radius Containment**

### Namespace Isolation for Platform Capabilities

```yaml
# Different namespaces = different failure domains
apiVersion: v1
kind: Namespace
metadata:
  name: platform-stable     # Production XRDs/Promises
---
apiVersion: v1
kind: Namespace
metadata:
  name: platform-beta       # Testing new versions
---
apiVersion: v1
kind: Namespace
metadata:
  name: platform-canary     # Platform team's canary
```

```yaml
# Install XRDs in different namespaces
# Stable version
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: postgres-config-v1
  namespace: platform-stable
spec:
  package: registry.example.com/postgres:v1.2.3
```

```yaml
# Beta version
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: postgres-config-v2
  namespace: platform-beta
spec:
  package: registry.example.com/postgres:v2.0.0-beta1
```

### Kratix Promise Isolation

```yaml
# Stable Promise - production ready
apiVersion: platform.kratix.io/v1alpha1
kind: Promise
metadata:
  name: postgres-v1
  namespace: platform-stable
  labels:
    stability: stable
    version: v1
spec:
  destinationSelectors:
  - matchLabels:
      environment: production  # Only prod clusters get stable
```

```yaml
# Beta Promise - testing
apiVersion: platform.kratix.io/v1alpha1
kind: Promise
metadata:
  name: postgres-v2
  namespace: platform-beta
  labels:
    stability: beta
    version: v2
spec:
  destinationSelectors:
  - matchLabels:
      environment: development  # Only dev clusters for beta
```

**Key insight:** Physical separation prevents cross-contamination. Beta capabilities can't affect prod workloads.

---

## **Architecture 4: The Promotion Pipeline**

### Stage 1: Platform Team Sandbox

```yaml
# platform-dev repo, branch: feature/postgres-v2
# ArgoCD App for platform team's testing cluster only
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-experiments
  namespace: argocd
spec:
  project: platform-team-only
  source:
    repoURL: https://github.com/org/platform-dev
    path: experimental
    targetRevision: HEAD  # Tracks all branches
  destination:
    server: https://platform-dev-cluster  # Isolated cluster!
    namespace: experiments
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Timeline:** 2-5 days of breaking things safely

### Stage 2: Canary Deployment

```yaml
# After testing in sandbox, promote to canary namespace
# Create ONE test claim using new version
apiVersion: platform.example.com/v1beta1
kind: PostgresDatabase
metadata:
  name: canary-test-db
  namespace: platform-canary
  labels:
    app: platform-canary-test
spec:
  version: v1beta1
  size: small
```

**Validation checklist:**
```bash
# Automated tests run against canary
- name: Validate Canary
  script: |
    # Check database was created
    kubectl wait --for=condition=Ready \
      postgresdatabase/canary-test-db --timeout=300s
    
    # Verify connection
    kubectl run -it --rm test-connection \
      --image=postgres:15 --restart=Never -- \
      psql $CONNECTION_STRING -c "SELECT 1"
    
    # Check no unintended side effects
    kubectl get postgresdatabase -A | \
      grep -v canary | grep -v Ready && exit 1
    
    # Passed? Promote to beta
```

**Timeline:** 1-2 days monitoring

### Stage 3: Beta (Opt-in for Early Adopters)

```yaml
# Merge to platform-infra repo, beta/ directory
# beta/argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-beta-capabilities
spec:
  source:
    repoURL: https://github.com/org/platform-infra
    path: platform-capabilities/beta
  destination:
    namespace: platform-beta
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
  syncWave: 20  # After stable (wave 10)
```

**Exposure strategy:**
```yaml
# Only show beta capabilities to opted-in teams
# Backstage template with annotation
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: postgres-v2-beta
  annotations:
    backstage.io/beta: "true"  # Hidden unless user enables beta features
```

**Timeline:** 2-4 weeks with friendly teams

### Stage 4: Stable Promotion

```yaml
# Move from beta/ to stable/
git mv platform-capabilities/beta/postgres-v2 \
       platform-capabilities/stable/postgres-v2

# Update ArgoCD app to point to stable
# stable/argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-stable-capabilities
spec:
  source:
    path: platform-capabilities/stable
  syncWave: 10  # Deploys before beta
```

**Deprecation of v1:**
```yaml
# Don't delete v1 immediately!
# Mark as deprecated in stable/postgres-v1/
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xpostgresdatabases.platform.example.com
  annotations:
    deprecated: "true"
    deprecation.message: "Use v1beta1. v1alpha1 will be removed in 90 days"
    sunset.date: "2025-06-01"
```

---

## **Architecture 5: Safety Mechanisms**

### 1. Resource Reconciliation Protection

```yaml
# Composition with deletion protection
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: postgres.platform.example.com
spec:
  resources:
  - name: rds-instance
    base:
      apiVersion: rds.aws.upbound.io/v1beta1
      kind: Instance
      metadata:
        annotations:
          # Prevent accidental deletion
          crossplane.io/external-name: preserve
      spec:
        deletionPolicy: Orphan  # Don't delete cloud resource
        forProvider:
          skipFinalSnapshot: false  # Always take snapshot
```

### 2. Drift Detection Alerts

```yaml
# ArgoCD notification when platform drifts
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
data:
  trigger.platform-drift: |
    - when: app.status.sync.status == 'OutOfSync'
      oncePer: app.metadata.name
      send: [platform-team-slack]
  
  template.platform-drift: |
    message: |
      ⚠️ PLATFORM DRIFT DETECTED
      App: {{.app.metadata.name}}
      Diff: {{.app.status.sync.comparisonResult.diff}}
      
      This may indicate someone manually modified platform resources.
      Review immediately: {{.context.argocdUrl}}/applications/{{.app.metadata.name}}
```

### 3. Pre-Sync Validation

```yaml
# ArgoCD PreSync hook to validate changes
apiVersion: batch/v1
kind: Job
metadata:
  name: validate-platform-changes
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
spec:
  template:
    spec:
      containers:
      - name: validator
        image: your-registry/platform-validator:v1
        command:
        - /bin/sh
        - -c
        - |
          # Check for dangerous changes
          
          # 1. Ensure no XRD deletions without migration
          if kubectl get xrd -o yaml | grep "deletionTimestamp"; then
            echo "ERROR: XRD deletion detected without migration plan"
            exit 1
          fi
          
          # 2. Validate all XRDs still compile
          for xrd in /manifests/xrds/*.yaml; do
            kubectl apply --dry-run=server -f $xrd || exit 1
          done
          
          # 3. Check for breaking schema changes
          /scripts/check-schema-compatibility.sh || exit 1
          
          echo "✓ Platform changes validated"
      restartPolicy: Never
```

### 4. Automatic Rollback Triggers

```yaml
# ArgoCD app with auto-rollback
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-stable-capabilities
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    retry:
      limit: 2
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 1m
  # Auto-rollback on health degradation
  ignoreDifferences:
  - group: apiextensions.crossplane.io
    kind: CompositeResourceDefinition
    jsonPointers:
    - /status/conditions
```

---

## **Architecture 6: Testing Strategy**

### Unit Tests for Compositions

```bash
# Use crossplane/composition-testing
cat <<EOF | kubectl apply --dry-run=client -f - -o yaml
apiVersion: platform.example.com/v1beta1
kind: PostgresDatabase
metadata:
  name: test-db
spec:
  size: medium
  environment: dev
EOF
```

```python
# Python test using crossplane render
import subprocess
import yaml

def test_postgres_composition():
    # Render composition with test claim
    result = subprocess.run([
        'crossplane', 'beta', 'render',
        'xrd.yaml',
        'composition.yaml',
        'claim.yaml'
    ], capture_output=True, text=True)
    
    resources = yaml.safe_load_all(result.stdout)
    
    # Assert expected resources created
    resource_types = [r['kind'] for r in resources]
    assert 'Instance' in resource_types  # RDS
    assert 'SubnetGroup' in resource_types
    assert 'SecurityGroup' in resource_types
    
    # Assert correct sizing
    for r in resources:
        if r['kind'] == 'Instance':
            assert r['spec']['forProvider']['instanceClass'] == 'db.t3.medium'
```

### Integration Tests in Canary

```yaml
# Tekton pipeline for canary testing
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: test-new-capability
spec:
  tasks:
  - name: create-test-claim
    taskSpec:
      steps:
      - name: apply-claim
        image: bitnami/kubectl
        script: |
          kubectl apply -f - <<EOF
          apiVersion: platform.example.com/v1beta1
          kind: PostgresDatabase
          metadata:
            name: test-${RANDOM}
            namespace: platform-canary
          spec:
            size: small
          EOF
  
  - name: wait-for-ready
    runAfter: [create-test-claim]
    taskSpec:
      steps:
      - name: wait
        image: bitnami/kubectl
        script: |
          kubectl wait --for=condition=Ready \
            postgresdatabase -n platform-canary \
            --all --timeout=600s
  
  - name: validate-connection
    runAfter: [wait-for-ready]
    taskSpec:
      steps:
      - name: test-connection
        image: postgres:15
        script: |
          # Get connection secret
          SECRET=$(kubectl get postgresdatabase -n platform-canary \
            -o jsonpath='{.items[0].status.connectionSecret}')
          
          # Test connection
          psql $(kubectl get secret $SECRET -o jsonpath='{.data.uri}' | base64 -d) \
            -c "SELECT version();"
  
  - name: cleanup
    runAfter: [validate-connection]
    taskSpec:
      steps:
      - name: delete
        image: bitnami/kubectl
        script: |
          kubectl delete postgresdatabase -n platform-canary --all
```

---

## **The Safety Checklist**

Before promoting ANY platform capability to production:

```markdown
## Platform Capability Promotion Checklist

### Phase 1: Development (platform-dev cluster)
- [ ] XRD compiles without errors
- [ ] Composition renders successfully with test claims
- [ ] Unit tests pass (`crossplane render`)
- [ ] No unexpected resources created
- [ ] Deletion completes cleanly (no orphaned resources)

### Phase 2: Canary (production cluster, isolated namespace)
- [ ] Single test claim created successfully
- [ ] Cloud resources provisioned correctly
- [ ] Connection/credentials work
- [ ] No impact on existing claims (monitored for 24h)
- [ ] Resource cleanup works (delete claim, verify cloud resources removed)

### Phase 3: Beta (production cluster, opt-in)
- [ ] Deployed to platform-beta namespace
- [ ] At least 2 friendly teams using it
- [ ] Running in production for 2+ weeks
- [ ] No escalated issues
- [ ] Metrics look healthy (provision time, error rate)
- [ ] Deprecation plan for old version documented

### Phase 4: Stable (production cluster, default)
- [ ] Moved to platform-stable namespace
- [ ] Documentation updated
- [ ] Backstage templates updated
- [ ] Old version marked deprecated (if applicable)
- [ ] Migration guide published (if breaking changes)
- [ ] Announcement sent to engineering teams

### Phase 5: Sunset (removing old version)
- [ ] 90-day deprecation notice given
- [ ] All existing claims migrated
- [ ] Old Composition removed
- [ ] Old XRD version marked as not served
```

---

## **Real-World Example: Database Upgrade**

**Scenario:** You want to add automated backups to PostgresDatabase XRD

### ❌ Dangerous Approach
```yaml
# Modifying existing v1alpha1 XRD
# This triggers reconciliation of ALL existing databases!
spec:
  versions:
  - name: v1alpha1
    schema:
      properties:
        spec:
          properties:
            backupRetention:  # NEW FIELD
              type: integer
              default: 7      # Uh oh, all DBs just got modified!
```

### ✅ Safe Approach
```yaml
# Create v1alpha2 with new feature
spec:
  versions:
  - name: v1alpha1      # OLD - still served
    served: true
    referenceable: true
    schema: {...}       # Unchanged
  
  - name: v1alpha2      # NEW - opt-in
    served: true
    referenceable: true
    schema:
      properties:
        spec:
          properties:
            backupRetention:
              type: integer
              default: 7
```

**Migration path:**
1. Deploy v1alpha2 to beta namespace
2. Create test claim with `apiVersion: v1alpha2`
3. Validate backups work
4. Document migration: "To enable backups, update your claim to v1alpha2"
5. Old claims keep working on v1alpha1 (no backups, but stable)
6. Teams migrate when ready
7. After 90 days, deprecate v1alpha1

---

## **Monitoring & Alerts**

```yaml
# Prometheus alerts for platform health
apiVersion: v1
kind: ConfigMap
metadata:
  name: platform-alerts
data:
  alerts.yaml: |
    groups:
    - name: platform-stability
      rules:
      - alert: CrossplaneReconciliationFailures
        expr: |
          rate(crossplane_reconcile_errors_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "Crossplane reconciliation errors detected"
          
      - alert: UnhealthyXRClaims
        expr: |
          count(crossplane_claim_status{condition="Ready",status="False"}) > 5
        for: 10m
        annotations:
          summary: "Multiple claims unhealthy"
          
      - alert: PlatformDrift
        expr: |
          argocd_app_sync_status{name=~"platform-.*",sync_status="OutOfSync"} == 1
        for: 15m
        annotations:
          summary: "Platform components drifted from Git"
```

**Dashboard metrics to track:**
- Claims created per day (by version)
- Time to ready (by XRD type)
- Error rate (by Composition)
- Resource churn (creates vs deletes)
- Platform component sync status

This architecture lets you innovate rapidly while keeping production stable. The key is **immutability** (versions never change) and **isolation** (blast radius containment).
