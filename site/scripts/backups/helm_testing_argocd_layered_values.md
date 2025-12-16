---
title: "ArgoCD and Helm Schema Validation"
summary: "ArgoCD and Helm Schema Validation is a infrastructure document covering ArgoCD and Helm Schema Validation and **How ArgoCD Uses Helm Schema Validation**. This resource provides information and guidance on the topic. See the full document for detailed information and implementation details."
keywords:
  - "yaml"
  - "argocd"
  - "helm"
  - "platform"
  - "api"
  - "production"
  - "kubernetes"
  - "staging"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

# ArgoCD and Helm Schema Validation

**Short answer:** Yes, but with important caveats about **when** and **how**.

---

## **How ArgoCD Uses Helm Schema Validation**

ArgoCD uses the native Helm client under the hood, which means:

1. **During sync**, ArgoCD runs essentially:
   ```bash
   helm template <release> <chart> -f values.yaml -f overrides.yaml
   ```

2. **Helm's schema validation happens** as part of template rendering

3. **If schema validation fails**, the sync fails and ArgoCD reports the error

**So yes, ArgoCD respects `values.schema.json`.**

---

## **The Critical Timing Difference**

### Standalone Helm:
```bash
helm install myapp ./chart -f values.yaml
```
- Schema validation happens **before** any Kubernetes API calls
- **Fail fast:** Bad values = immediate error, nothing deployed

### ArgoCD:
```bash
# ArgoCD syncs the application
```
- Schema validation happens during the **sync phase**
- Might reach **DEGRADED** state if validation fails
- Could have **partial resources** created before failure (depending on sync waves)

---

## **Where This Matters for Your Layered Values**

### Scenario 1: Values in ArgoCD Application Manifest

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    repoURL: https://github.com/org/charts
    path: charts/myapp
    helm:
      valueFiles:
        - values.yaml
        - platform.yaml  # Your override file
```

**What happens:**
- ArgoCD passes both files to Helm in order
- Helm merges them: `values.yaml` + `platform.yaml`
- Schema validates the **merged result**
- ✅ Works exactly like running `helm install -f values.yaml -f platform.yaml`

---

### Scenario 2: Values in Different Repos/ConfigMaps

**This is where it gets tricky with your layered approach.**

#### Pattern A: Values File + ArgoCD Parameters
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    helm:
      valueFiles:
        - values.yaml
      parameters:
        - name: database.password
          value: "secret-from-vault"
```

**What happens:**
- Helm merges `values.yaml` + parameters
- Schema validation sees merged result
- ✅ If database.password is in parameters, validation passes

#### Pattern B: Values in External ConfigMap/Secret
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    helm:
      valueFiles:
        - values.yaml
        - secrets://mysecret/platform-values  # External values
```

**What happens:**
- ArgoCD resolves the secret/configmap
- Passes both files to Helm
- ✅ Schema validates merged result

---

## **ArgoCD-Specific Considerations**

### 1. **Server-Side vs. Client-Side Rendering**

ArgoCD has two modes:

#### Client-Side (Default):
```yaml
spec:
  source:
    helm:
      skipCrds: false
```
- Helm runs **on the ArgoCD server**
- Schema validation happens on ArgoCD server
- Same behavior as local `helm template`

#### Server-Side:
```yaml
spec:
  source:
    helm:
      skipCrds: true
  syncPolicy:
    syncOptions:
      - ServerSideApply=true
```
- Kubernetes handles the apply
- But Helm **still renders** the template first
- Schema validation **still happens**

---

### 2. **Multi-Source Applications (ArgoCD 2.6+)**

This is **game-changing** for your layered values pattern:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  sources:
    # Source 1: The Helm chart
    - repoURL: https://github.com/org/charts
      path: charts/myapp
      targetRevision: main
      helm:
        valueFiles:
          - values.yaml
          - $values/platform-config/production/platform.yaml
    
    # Source 2: Platform values repository
    - repoURL: https://github.com/org/platform-config
      targetRevision: main
      ref: values
```

**What happens:**
- ArgoCD fetches both repos
- Merges values from both sources
- Passes merged values to Helm
- ✅ Schema validates the final merged result

**This solves the "values in different repos" problem cleanly.**

---

### 3. **App of Apps Pattern**

```yaml
# Root application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-apps
spec:
  source:
    repoURL: https://github.com/org/platform
    path: applications
```

Where `applications/` contains:
```yaml
# applications/myapp.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  source:
    helm:
      valueFiles:
        - ../../base-values/values.yaml
        - ../../platform-values/production/platform.yaml
```

**What happens:**
- Each child app has its value file references
- Helm merges them per application
- ✅ Schema validation works per app

---

## **When Schema Validation Fails in ArgoCD**

### The Error Flow:

1. **ArgoCD detects out of sync**
2. **Attempts sync**
3. **Helm renders template** (schema validation happens here)
4. **Schema validation fails**
5. **ArgoCD shows error:**
   ```
   ComparisonError
   rpc error: code = Unknown desc = 
   Helm template rendering failed: values don't meet the 
   specifications of the schema(s) in the following chart(s):
   myapp:
   - database.password: Invalid type. Expected: string, given: null
   ```
6. **Application status:** `OutOfSync` and `Degraded`
7. **No resources applied** (template rendering failed before apply)

---

## **Key Differences from Standalone Helm**

| Aspect | Standalone Helm | ArgoCD with Helm |
|--------|----------------|------------------|
| **When validation runs** | Before any K8s calls | During sync phase |
| **Failure impact** | Installation aborted | Sync fails, app degraded |
| **Retry behavior** | Manual only | Auto-retry if configured |
| **Error visibility** | CLI output | ArgoCD UI + notifications |
| **Values source** | Local files only | Repos, ConfigMaps, Secrets, Plugins |
| **Multi-source values** | Not supported | Supported (v2.6+) |

---

## **Best Practices for ArgoCD + Layered Values**

### 1. **Use Multi-Source for Clean Separation**
```yaml
sources:
  - repoURL: <chart-repo>
    helm:
      valueFiles:
        - values.yaml  # Base
        - $platform/production.yaml  # Platform layer
  - repoURL: <platform-repo>
    ref: platform
```

### 2. **Test Locally First**
```bash
# Simulate what ArgoCD will do
helm template myapp ./chart \
  -f values.yaml \
  -f ../platform-config/production/platform.yaml
```

### 3. **Use ArgoCD Application Sets for Multiple Environments**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp-environments
spec:
  generators:
    - list:
        elements:
          - env: dev
            platform: dev-platform.yaml
          - env: staging
            platform: staging-platform.yaml
          - env: production
            platform: production-platform.yaml
  template:
    spec:
      source:
        helm:
          valueFiles:
            - values.yaml
            - '{{platform}}'
```

Each environment gets the right platform.yaml, schema validates each separately.

### 4. **Configure Sync Policies Carefully**
```yaml
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

If schema validation fails, ArgoCD will retry based on this config.

---

## **Monitoring Schema Validation in ArgoCD**

### ArgoCD Notifications for Schema Failures
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
data:
  trigger.on-schema-error: |
    - when: app.status.operationState.phase == 'Error' && 
            app.status.operationState.message contains 'schema'
      send: [slack-platform-team]
  
  template.schema-error: |
    message: |
      🚨 Schema Validation Failed
      App: {{.app.metadata.name}}
      Error: {{.app.status.operationState.message}}
      
      This usually means platform.yaml is missing required overrides.
      Check: https://wiki.company.com/platform-values-guide
```

### Prometheus Metrics
```promql
# Count of apps with schema errors
argocd_app_info{sync_status="OutOfSync", health_status="Degraded"} 
  and 
  on(name) 
  argocd_app_sync_total{phase="Error"}
```

---

## **The Bottom Line**

**Yes, ArgoCD uses Helm schema validation**, and it works **exactly like** running `helm template` with your merged values files.

**For your layered values approach:**
- ✅ ArgoCD merges values.yaml + platform.yaml before validation
- ✅ Schema sees the final merged result
- ✅ Works the same as standalone Helm
- ✅ Multi-source apps (ArgoCD 2.6+) make this pattern clean
- ⚠️ Validation failures show in ArgoCD UI, not CLI
- ⚠️ Set up notifications for schema errors
- ⚠️ Test locally first to catch errors before committing

**The schema strategy I showed you (EXAMPLE-13 with sentinel values) works perfectly with ArgoCD** because:
1. Chart packages with sentinel values in values.yaml
2. ArgoCD merges values.yaml + platform.yaml
3. Helm validates merged result
4. Schema catches any remaining sentinel values (= missing overrides)
5. Clear error message in ArgoCD UI

No special ArgoCD configuration needed—it just works.
