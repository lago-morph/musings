# Package Patterns for Crossplane v2

## Provider Installation

### Fully Qualified Package Names (Required)
```yaml
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v1.14.0  # ✅ Fully qualified
```

### ❌ Forbidden Patterns
```bash
# DON'T USE - --registry flag removed
kubectl crossplane install provider provider-aws --registry=xpkg.upbound.io

# DON'T USE - unqualified names
kubectl crossplane install provider provider-aws
```

### ✅ Correct Installation
```bash
# Use fully qualified names
kubectl crossplane install provider xpkg.upbound.io/upbound/provider-aws-s3:v1.14.0
```

## Upbound Provider Architecture

### Individual Service Providers (Required)
```yaml
# Install each service individually
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v1.14.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-rds
spec:
  package: xpkg.upbound.io/upbound/provider-aws-rds:v1.14.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-ec2
spec:
  package: xpkg.upbound.io/upbound/provider-aws-ec2:v1.14.0
```

### Family Provider Auto-Installation
- First individual provider automatically installs `provider-family-aws`
- Family provider manages shared ProviderConfig
- No need to manually install family provider

## Function Installation

### Composition Functions
```yaml
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: function-patch-and-transform
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.1.4

---
apiVersion: pkg.crossplane.io/v1
kind: Function
metadata:
  name: function-go-templating
spec:
  package: xpkg.upbound.io/crossplane-contrib/function-go-templating:v0.4.0
```

## Configuration Patterns

### DeploymentRuntimeConfig (Not ControllerConfig)
```yaml
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: aws-config
spec:
  replicas: 2
  serviceAccountTemplate:
    metadata:
      annotations:
        eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/crossplane
  deploymentTemplate:
    spec:
      template:
        spec:
          containers:
          - name: package-runtime
            resources:
              requests:
                memory: 256Mi
                cpu: 100m
              limits:
                memory: 512Mi
                cpu: 500m
```

### Apply to Provider
```yaml
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-s3
spec:
  package: xpkg.upbound.io/upbound/provider-aws-s3:v1.14.0
  runtimeConfigRef:
    name: aws-config  # References DeploymentRuntimeConfig
```

## Managed Resource Activation Policies

### Default MRAP (Activates All)
```yaml
apiVersion: pkg.crossplane.io/v1alpha1
kind: ManagedResourceActivationPolicy
metadata:
  name: default
spec:
  activationRules:
  - resources: ["*"]
    apiGroups: ["*"]
```

### Targeted MRAP (Efficient)
```yaml
apiVersion: pkg.crossplane.io/v1alpha1
kind: ManagedResourceActivationPolicy
metadata:
  name: targeted
spec:
  activationRules:
  - resources: ["buckets"]
    apiGroups: ["s3.aws.m.crossplane.io"]
  - resources: ["dbinstances"]
    apiGroups: ["rds.aws.m.crossplane.io"]
```

## Package Verification

### Check Installed Packages
```bash
kubectl get providers
kubectl get functions
kubectl get configurations
```

### Check Available MRs
```bash
kubectl api-resources | grep upbound
kubectl api-resources | grep m.crossplane.io
```

## Key Differences from v1

### ❌ v1 Pattern (FORBIDDEN)
```yaml
# ControllerConfig (deprecated)
apiVersion: pkg.crossplane.io/v1alpha1
kind: ControllerConfig
metadata:
  name: aws-config
spec:
  replicas: 2
```

### ✅ v2 Pattern (CORRECT)
```yaml
# DeploymentRuntimeConfig
apiVersion: pkg.crossplane.io/v1beta1
kind: DeploymentRuntimeConfig
metadata:
  name: aws-config
spec:
  replicas: 2
```

## Web Search Patterns
- "Crossplane v2.1 provider installation fully qualified"
- "Crossplane v2.1 DeploymentRuntimeConfig"
- "Crossplane v2.1 upbound provider family"