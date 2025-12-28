# Composition Patterns for Crossplane v2

## Basic Pipeline Mode Composition

### v2 Composition Template
```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: example-database
spec:
  compositeTypeRef:
    apiVersion: example.com/v1alpha1
    kind: XDatabase
  mode: Pipeline  # ✅ REQUIRED: Pipeline mode
  pipeline:       # ✅ REQUIRED: Function pipeline
  - step: patch-and-transform
    functionRef:
      name: function-patch-and-transform
    input:
      apiVersion: pt.fn.crossplane.io/v1beta1
      kind: Resources
      resources:
      - name: rds-instance
        base:
          apiVersion: rds.aws.m.crossplane.io/v1beta1  # ✅ .m.crossplane.io
          kind: DBInstance
          metadata:
            name: # Will be generated
          spec:
            forProvider:
              region: us-east-1
        patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.size
          toFieldPath: spec.forProvider.dbInstanceClass
```

## Required Function Installation

### Install Patch and Transform Function
```yaml
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: function-patch-and-transform
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.1.4
```

## Pipeline Steps

### Single Function
```yaml
pipeline:
- step: patch-and-transform
  functionRef:
    name: function-patch-and-transform
  input:
    # Function-specific input
```

### Multiple Functions
```yaml
pipeline:
- step: generate-resources
  functionRef:
    name: function-go-templating
  input:
    # First function input
- step: patch-resources
  functionRef:
    name: function-patch-and-transform
  input:
    # Second function input
```

## Common Patch Patterns

### FromCompositeFieldPath
```yaml
patches:
- type: FromCompositeFieldPath
  fromFieldPath: spec.parameters.region
  toFieldPath: spec.forProvider.region
```

### ToCompositeFieldPath (Status)
```yaml
patches:
- type: ToCompositeFieldPath
  fromFieldPath: status.atProvider.endpoint
  toFieldPath: status.endpoint
```

### Transform Values
```yaml
patches:
- type: FromCompositeFieldPath
  fromFieldPath: spec.parameters.size
  toFieldPath: spec.forProvider.dbInstanceClass
  transforms:
  - type: map
    map:
      small: db.t3.micro
      medium: db.t3.small
      large: db.t3.medium
```

## Composing Kubernetes Resources

### Direct Kubernetes Resource Composition
```yaml
resources:
- name: app-deployment
  base:
    apiVersion: apps/v1  # ✅ Direct K8s resources
    kind: Deployment
    metadata:
      namespace: # Will match XR namespace
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: example
      template:
        metadata:
          labels:
            app: example
        spec:
          containers:
          - name: app
            image: nginx
- name: app-service
  base:
    apiVersion: v1
    kind: Service
    metadata:
      namespace: # Will match XR namespace
    spec:
      selector:
        app: example
      ports:
      - port: 80
```

## Key Differences from v1

### ❌ v1 Pattern (FORBIDDEN)
```yaml
spec:
  resources:  # Resources mode deprecated
  - name: rds
    base:
      apiVersion: rds.aws.crossplane.io/v1alpha1  # Old API group
      kind: DBInstance
    patches:
    - type: FromCompositeFieldPath
      # Direct patches without functions
```

### ✅ v2 Pattern (CORRECT)
```yaml
spec:
  mode: Pipeline  # Pipeline mode required
  pipeline:
  - step: patch-and-transform
    functionRef:
      name: function-patch-and-transform
    input:
      resources:
      - name: rds
        base:
          apiVersion: rds.aws.m.crossplane.io/v1beta1  # New API group
          kind: DBInstance
```

## Web Search Patterns
- "Crossplane v2.1 Pipeline mode composition"
- "Crossplane v2.1 function-patch-and-transform"
- "Crossplane v2.1 composition functions"