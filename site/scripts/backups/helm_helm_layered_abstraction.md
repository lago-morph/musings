---
title: "Solution 2: Kustomize with Helm"
summary: "Great question - this is a common challenge with multi-layered architectures. Here are several approaches, from simplest to most sophisticated:."
keywords:
  - "yaml"
  - "helm"
  - "argocd"
  - "gitops"
  - "kubernetes"
  - "staging"
  - "security"
  - "monitoring"
category: "infrastructure"
categoryName: "Infrastructure"
weight: 3
date: "2025-12-16"
draft: false
toc: true
---

Great question - this is a common challenge with multi-layered architectures. Here are several approaches, from simplest to most sophisticated:

## Solution 1: Values Repository with ArgoCD valueFiles

This is the cleanest approach for your use case.

**Repository Structure:**
```
gitops-repo/
├── values/
│   ├── common/
│   │   ├── global.yaml           # Shared across all layers
│   │   ├── networking.yaml       # Network configs
│   │   └── observability.yaml    # Logging, metrics
│   ├── environments/
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── layers/
│       ├── data-persistence.yaml
│       ├── platform-services.yaml
│       ├── application-services.yaml
│       └── ingress.yaml
├── applications/
│   ├── data-persistence-app.yaml
│   ├── platform-services-app.yaml
│   ├── application-services-app.yaml
│   └── ingress-app.yaml
└── charts/                        # Your actual Helm charts
    ├── data-persistence/
    ├── platform-services/
    ├── application-services/
    └── ingress/
```

**ArgoCD Application Example:**
```yaml
# applications/data-persistence-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: data-persistence
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourorg/gitops-repo
    targetRevision: main
    path: charts/data-persistence
    helm:
      valueFiles:
      - ../../values/common/global.yaml
      - ../../values/common/networking.yaml
      - ../../values/environments/prod.yaml
      - ../../values/layers/data-persistence.yaml
      values: |
        # Inline overrides if needed
        specificOverride: value
  destination:
    server: https://kubernetes.default.svc
    namespace: data-persistence
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Common Values Example:**
```yaml
# values/common/global.yaml
global:
  environment: prod
  region: us-east-1
  domain: example.com
  
  labels:
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/part-of: myapp
  
  imageRegistry: registry.example.com
  imagePullSecrets:
    - name: registry-creds
  
  monitoring:
    enabled: true
    serviceMonitor: true
    
  security:
    podSecurityStandard: restricted
    networkPolicies: true
```

```yaml
# values/common/networking.yaml
networking:
  serviceMesh:
    enabled: true
    type: istio
  
  dns:
    clusterDomain: cluster.local
    
  loadBalancer:
    class: nginx
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: nlb
```

```yaml
# values/layers/data-persistence.yaml
postgresql:
  enabled: true
  replicaCount: 3
  storage:
    size: 100Gi
    storageClass: fast-ssd

redis:
  enabled: true
  cluster:
    enabled: true
    nodes: 6
```

**Pros:**
- Simple and obvious - values are in one place
- ArgoCD natively supports multiple valueFiles
- Easy to see which values apply to which layer
- Version controlled with everything else
- No external dependencies
- Works perfectly with GitOps

**Cons:**
- Values files can grow large
- Some duplication between layers if they need similar configs
- Need to maintain relative paths in Applications

## Solution 2: Kustomize with Helm

Use Kustomize as a wrapper to compose values, then render with Helm.

**Repository Structure:**
```
gitops-repo/
├── base/
│   ├── values/
│   │   ├── global.yaml
│   │   └── networking.yaml
│   └── charts/
│       ├── data-persistence/
│       ├── platform-services/
│       ├── application-services/
│       └── ingress/
├── overlays/
│   ├── prod/
│   │   ├── kustomization.yaml
│   │   ├── values/
│   │   │   └── prod-overrides.yaml
│   │   └── layers/
│   │       ├── data-persistence/
│   │       │   ├── kustomization.yaml
│   │       │   └── values.yaml
│   │       ├── platform-services/
│   │       │   ├── kustomization.yaml
│   │       │   └── values.yaml
│   │       └── ...
│   └── staging/
│       └── ...
└── applications/
    └── app-of-apps.yaml
```

**Kustomization for a Layer:**
```yaml
# overlays/prod/layers/data-persistence/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

helmCharts:
- name: data-persistence
  repo: oci://registry.example.com/charts
  version: 1.2.3
  releaseName: data-persistence
  namespace: data-persistence
  valuesFile: values.yaml
  valuesInline:
    global:
      environment: prod
  valuesMerge: merge  # Merge all values files

configMapGenerator:
- name: shared-values
  files:
  - ../../../../base/values/global.yaml
  - ../../../../base/values/networking.yaml
```

**Pros:**
- Powerful composition with Kustomize overlays
- Can use patches for fine-grained control
- Standard Kubernetes tooling
- Good for complex multi-environment setups

**Cons:**
- More complex than pure Helm
- Kustomize + Helm interaction can be confusing
- Harder to understand for team members unfamiliar with Kustomize
- ArgoCD needs to be configured to use Kustomize with Helm

## Solution 3: Helm Umbrella Chart with Dependencies

Create a parent "umbrella" chart that includes all layers as dependencies.

**Repository Structure:**
```
gitops-repo/
├── umbrella-chart/
│   ├── Chart.yaml
│   ├── values.yaml              # Global defaults
│   ├── values-prod.yaml
│   ├── values-staging.yaml
│   └── charts/                  # Subcharts (can be local or remote)
│       ├── data-persistence/
│       ├── platform-services/
│       ├── application-services/
│       └── ingress/
└── applications/
    ├── data-persistence-app.yaml  # Can still deploy independently
    ├── platform-services-app.yaml
    └── umbrella-app.yaml          # Or deploy all together
```

**Umbrella Chart.yaml:**
```yaml
# umbrella-chart/Chart.yaml
apiVersion: v2
name: myapp-stack
version: 1.0.0
dependencies:
  - name: data-persistence
    version: "1.x.x"
    repository: "file://./charts/data-persistence"
    condition: data-persistence.enabled
    
  - name: platform-services
    version: "1.x.x"
    repository: "file://./charts/platform-services"
    condition: platform-services.enabled
    
  - name: application-services
    version: "1.x.x"
    repository: "file://./charts/application-services"
    condition: application-services.enabled
    
  - name: ingress
    version: "1.x.x"
    repository: "file://./charts/ingress"
    condition: ingress.enabled
```

**Umbrella values.yaml:**
```yaml
# umbrella-chart/values.yaml
global:
  environment: prod
  domain: example.com
  imageRegistry: registry.example.com

# Shared values accessible to all subcharts via .Values.global
networking:
  serviceMesh:
    enabled: true

# Per-layer config
data-persistence:
  enabled: true
  postgresql:
    replicaCount: 3

platform-services:
  enabled: true
  kafka:
    replicaCount: 3

application-services:
  enabled: true
  replicaCount: 5

ingress:
  enabled: true
  className: nginx
```

**Individual ArgoCD Application (for independent deployment):**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: data-persistence
spec:
  source:
    repoURL: https://github.com/yourorg/gitops-repo
    path: umbrella-chart/charts/data-persistence
    helm:
      valueFiles:
      - ../../values.yaml
      - ../../values-prod.yaml
      parameters:
      - name: global.environment
        value: prod
```

**Pros:**
- Standard Helm pattern
- Global values automatically shared via `.Values.global`
- Can deploy all together or individually
- Clear parent-child relationship

**Cons:**
- Harder to deploy layers truly independently
- Dependency management can be complex
- Version coordination between umbrella and subcharts
- Not as flexible as separate charts

## Solution 4: ConfigMap/Secret with External Values

Store common values in a ConfigMap, reference from Applications.

**Repository Structure:**
```
gitops-repo/
├── shared-config/
│   ├── common-values-configmap.yaml
│   └── prod-values-configmap.yaml
├── charts/
│   ├── data-persistence/
│   ├── platform-services/
│   ├── application-services/
│   └── ingress/
└── applications/
    ├── common-config-app.yaml    # Deploys ConfigMaps first
    ├── data-persistence-app.yaml
    └── ...
```

**ConfigMap with Common Values:**
```yaml
# shared-config/common-values-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: common-helm-values
  namespace: argocd
data:
  global.yaml: |
    global:
      environment: prod
      domain: example.com
      imageRegistry: registry.example.com
  
  networking.yaml: |
    networking:
      serviceMesh:
        enabled: true
      loadBalancer:
        class: nginx
```

**ArgoCD Application referencing ConfigMap:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: data-persistence
spec:
  source:
    helm:
      valuesObject:
        global: $common-helm-values:global.yaml
        networking: $common-helm-values:networking.yaml
      values: |
        # Layer-specific values
        postgresql:
          replicaCount: 3
```

**Pros:**
- Values live in cluster as ConfigMaps
- Can update shared values without touching Application manifests
- Supports secrets for sensitive values

**Cons:**
- NOT fully GitOps (values in cluster, not just git)
- Complex syntax in ArgoCD
- Harder to review changes
- Less obvious what values are being used
- Not recommended for most use cases

## My Recommendation: Solution 1 (Values Repository)

For your use case (4 layers, GitOps, ArgoCD), **Solution 1** is the cleanest because:

1. **Truly GitOps** - Everything version controlled in git
2. **Simple mental model** - Values files are just YAML files
3. **Native ArgoCD support** - Multiple valueFiles work out of the box
4. **Easy to review** - PRs show exactly what changed
5. **Independent deployment** - Each layer has its own Application
6. **Flexible** - Easy to override at any level

### Detailed Implementation of Solution 1

**Directory Structure:**
```
myapp-gitops/
├── README.md
├── values/
│   ├── common/
│   │   ├── README.md
│   │   ├── global.yaml           # Cluster-wide settings
│   │   ├── networking.yaml       # Network policies, service mesh
│   │   ├── observability.yaml    # Monitoring, logging, tracing
│   │   ├── security.yaml         # RBAC, pod security, secrets
│   │   └── storage.yaml          # Storage classes, PV configs
│   ├── environments/
│   │   ├── dev.yaml              # Dev-specific overrides
│   │   ├── staging.yaml
│   │   └── prod.yaml
│   └── layers/
│       ├── data-persistence/
│       │   ├── base.yaml         # Base config for this layer
│       │   ├── dev.yaml          # Dev overrides for this layer
│       │   ├── staging.yaml
│       │   └── prod.yaml
│       ├── platform-services/
│       │   └── ...
│       ├── application-services/
│       │   └── ...
│       └── ingress/
│           └── ...
├── charts/
│   ├── data-persistence/         # Your Helm charts
│   ├── platform-services/
│   ├── application-services/
│   └── ingress/
└── applications/
    ├── envs/
    │   ├── dev/
    │   │   ├── data-persistence.yaml
    │   │   ├── platform-services.yaml
    │   │   ├── application-services.yaml
    │   │   └── ingress.yaml
    │   ├── staging/
    │   │   └── ...
    │   └── prod/
    │       └── ...
    └── app-of-apps/
        ├── dev.yaml
        ├── staging.yaml
        └── prod.yaml
```

**Loading Order (Prod Data Persistence Example):**
```yaml
# applications/envs/prod/data-persistence.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: data-persistence-prod
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  
  source:
    repoURL: https://github.com/yourorg/myapp-gitops
    targetRevision: main
    path: charts/data-persistence
    
    helm:
      # Values are merged in order - later files override earlier
      valueFiles:
      # 1. Common values (most generic)
      - ../../values/common/global.yaml
      - ../../values/common/networking.yaml
      - ../../values/common/observability.yaml
      - ../../values/common/security.yaml
      - ../../values/common/storage.yaml
      
      # 2. Environment-specific (overrides common)
      - ../../values/environments/prod.yaml
      
      # 3. Layer base config (overrides environment)
      - ../../values/layers/data-persistence/base.yaml
      
      # 4. Layer + environment specific (most specific, final override)
      - ../../values/layers/data-persistence/prod.yaml
      
      # 5. Inline values (highest priority)
      values: |
        # Emergency overrides or computed values
        deploymentTimestamp: "2024-12-11T10:00:00Z"
  
  destination:
    server: https://kubernetes.default.svc
    namespace: data-persistence
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    
  # Ensure this layer deploys after dependencies
  # info:
  #   - name: 'Depends on'
  #     value: 'none (this is the base layer)'
```

**Example Values Files:**

```yaml
# values/common/global.yaml
global:
  # These are accessible in charts as .Values.global.*
  environment: ""  # Will be overridden by environment file
  cluster:
    name: production-us-east-1
    region: us-east-1
    provider: aws
  
  domain: example.com
  
  imageRegistry: registry.example.com
  imagePullPolicy: IfNotPresent
  imagePullSecrets:
    - name: registry-credentials
  
  labels:
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/part-of: myapp
    compliance: sox
    cost-center: engineering
  
  annotations:
    app.kubernetes.io/documentation: "https://docs.example.com"
  
  monitoring:
    enabled: true
    prometheus:
      serviceMonitor: true
      interval: 30s
    grafana:
      dashboards: true
  
  backup:
    enabled: true
    schedule: "0 2 * * *"
    retention: 30d
```

```yaml
# values/environments/prod.yaml
global:
  environment: production
  
resources:
  # Default resource requests/limits for prod
  defaults:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 1000m
      memory: 1Gi

replicaCount:
  # Default replica counts for prod
  minimum: 3
  
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

persistence:
  storageClass: gp3-encrypted
  backup:
    enabled: true
    
security:
  podSecurityPolicy: restricted
  networkPolicies:
    enabled: true
```

```yaml
# values/layers/data-persistence/base.yaml
# Base configuration for data persistence layer across all environments

postgresql:
  enabled: true
  architecture: replication
  auth:
    existingSecret: postgres-credentials
  
  primary:
    persistence:
      size: 50Gi
  
  readReplicas:
    replicaCount: 1
  
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true

redis:
  enabled: true
  architecture: replication
  auth:
    existingSecret: redis-credentials
  
  master:
    persistence:
      size: 10Gi
  
  replica:
    replicaCount: 1
  
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
```

```yaml
# values/layers/data-persistence/prod.yaml
# Production-specific overrides for data persistence

postgresql:
  primary:
    resources:
      requests:
        cpu: 2
        memory: 4Gi
      limits:
        cpu: 4
        memory: 8Gi
    persistence:
      size: 500Gi  # Much larger in prod
  
  readReplicas:
    replicaCount: 2  # More replicas in prod
    resources:
      requests:
        cpu: 1
        memory: 2Gi
      limits:
        cpu: 2
        memory: 4Gi
  
  backup:
    enabled: true
    schedule: "0 */6 * * *"  # Every 6 hours
    s3:
      bucket: myapp-prod-db-backups
      region: us-east-1

redis:
  master:
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 2
        memory: 4Gi
    persistence:
      size: 50Gi
  
  replica:
    replicaCount: 2
    resources:
      requests:
        cpu: 250m
        memory: 512Mi
      limits:
        cpu: 1
        memory: 2Gi
```

**App-of-Apps Pattern:**
```yaml
# applications/app-of-apps/prod.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-prod
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/yourorg/myapp-gitops
    targetRevision: main
    path: applications/envs/prod
  
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Benefits of This Structure:

1. **Clear precedence**: common → environment → layer base → layer+environment → inline
2. **DRY principle**: Shared values in one place
3. **Easy overrides**: Each level can override previous
4. **Environment isolation**: Easy to see what's different in prod vs dev
5. **Layer isolation**: Each layer's config is self-contained
6. **Reviewable**: Git diffs clearly show what changed at which level
7. **Testable**: Can test individual layers in isolation

### Tips for Managing This:

1. **Document the loading order** in README files
2. **Use YAML anchors** in common files for reusable snippets
3. **Validate with helm template** before committing:
   ```bash
   helm template charts/data-persistence \
     -f values/common/global.yaml \
     -f values/environments/prod.yaml \
     -f values/layers/data-persistence/base.yaml \
     -f values/layers/data-persistence/prod.yaml
   ```
4. **Use CI to validate** all combinations render correctly
5. **Keep values files focused** - don't put everything in global.yaml

Would you like me to elaborate on any specific aspect of this structure?
