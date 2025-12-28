# Resource Patterns for Crossplane v2

## Managed Resource (MR) Patterns

### v2 Namespaced MR
```yaml
apiVersion: s3.aws.m.crossplane.io/v1beta1  # ✅ .m.crossplane.io
kind: Bucket
metadata:
  name: my-bucket
  namespace: default  # ✅ Namespaced
spec:
  forProvider:
    region: us-east-1
  providerConfigRef:
    name: aws-config
```

### API Group Changes
**v1 → v2 API Group Migration:**
- `s3.aws.crossplane.io` → `s3.aws.m.crossplane.io`
- `ec2.aws.crossplane.io` → `ec2.aws.m.crossplane.io`
- `rds.aws.crossplane.io` → `rds.aws.m.crossplane.io`

## XR Usage Patterns

### Direct XR Creation (No Claims)
```yaml
apiVersion: example.com/v1alpha1
kind: XDatabase
metadata:
  name: my-database
  namespace: production  # ✅ Namespaced
spec:
  parameters:
    size: medium
    region: us-west-2
```

### XR with Resource References
```yaml
apiVersion: example.com/v1alpha1
kind: XDatabase
metadata:
  name: my-database
  namespace: production
spec:
  parameters:
    size: medium
status:
  resourceRefs:
  - apiVersion: rds.aws.m.crossplane.io/v1beta1
    kind: DBInstance
    name: my-database-rds
    namespace: production  # ✅ Same namespace
  endpoint: "my-db.cluster-xyz.us-west-2.rds.amazonaws.com"
```

## Namespace Scoping Rules

### XR and MR Namespace Relationship
- **Namespaced XRs**: Create MRs in the same namespace
- **Cluster-scoped XRs**: Can create MRs in any namespace (specify explicitly)

### Example: Namespaced XR → Namespaced MRs
```yaml
# XR in 'production' namespace
apiVersion: example.com/v1alpha1
kind: XDatabase
metadata:
  name: my-db
  namespace: production

# Creates MRs in 'production' namespace
# (automatically handled by composition)
```

## Provider Configuration

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
```

### ProviderConfig
```yaml
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-config
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-secret
      key: creds
```

## Connection Secrets

### Secret Creation Pattern
```yaml
# In composition, create a secret that aggregates connection details
- name: connection-secret
  base:
    apiVersion: v1
    kind: Secret
    metadata:
      namespace: # Same as XR namespace
    type: Opaque
    data:
      endpoint: # Base64 encoded endpoint
      username: # Base64 encoded username
      password: # Base64 encoded password
  patches:
  - type: FromCompositeFieldPath
    fromFieldPath: metadata.name
    toFieldPath: metadata.name
    transforms:
    - type: string
      string:
        fmt: "%s-connection"
```

## Key Differences from v1

### ❌ v1 Pattern (FORBIDDEN)
```yaml
# Cluster-scoped MR
apiVersion: s3.aws.crossplane.io/v1alpha1  # Old API group
kind: Bucket
metadata:
  name: my-bucket
  # No namespace - cluster scoped
```

### ✅ v2 Pattern (CORRECT)
```yaml
# Namespaced MR
apiVersion: s3.aws.m.crossplane.io/v1beta1  # New API group
kind: Bucket
metadata:
  name: my-bucket
  namespace: default  # Namespaced
```

## Web Search Patterns
- "Crossplane v2.1 namespaced managed resources"
- "Crossplane v2.1 .m.crossplane.io API group"
- "Crossplane v2.1 XR namespace scoping"