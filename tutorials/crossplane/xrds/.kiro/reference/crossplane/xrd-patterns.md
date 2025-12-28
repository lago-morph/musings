# XRD Patterns for Crossplane v2

## Basic XRD Structure

### v2 XRD Template
```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: xdatabases.example.com
spec:
  group: example.com
  names:
    kind: XDatabase
    plural: xdatabases
  scope: Namespaced  # ✅ REQUIRED: Explicit scope
  versions:
  - name: v1alpha1
    served: true
    referenceable: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              parameters:
                type: object
                properties:
                  size:
                    type: string
                    enum: ["small", "medium", "large"]
          status:
            type: object
            properties:
              endpoint:
                type: string
```

## Scope Field Options

### Namespaced (Default)
```yaml
spec:
  scope: Namespaced  # XRs live in namespaces
```
**Use when:** XRs should be namespace-scoped (most common)

### Cluster-Scoped
```yaml
spec:
  scope: Cluster  # XRs are cluster-wide
```
**Use when:** XRs need cluster-wide access or represent cluster-level resources

## Key Differences from v1

### ❌ v1 Pattern (FORBIDDEN)
```yaml
spec:
  claimNames:  # DOESN'T EXIST IN V2
    kind: DatabaseClaim
    plural: databaseclaims
  # scope field didn't exist
```

### ✅ v2 Pattern (CORRECT)
```yaml
spec:
  scope: Namespaced  # REQUIRED: Explicit scope
  # No claimNames - XRs are used directly
```

## Status Field Patterns

### Connection Details
```yaml
status:
  type: object
  properties:
    endpoint:
      type: string
    connectionSecret:
      type: string
```

### Resource References
```yaml
status:
  type: object
  properties:
    resourceRefs:
      type: array
      items:
        type: object
        properties:
          apiVersion:
            type: string
          kind:
            type: string
          name:
            type: string
          namespace:
            type: string  # ✅ Namespaced resources
```

## Common XRD Patterns

### Simple Parameter Passing
```yaml
spec:
  type: object
  properties:
    parameters:
      type: object
      properties:
        region:
          type: string
        instanceType:
          type: string
```

### Complex Nested Configuration
```yaml
spec:
  type: object
  properties:
    database:
      type: object
      properties:
        engine:
          type: string
          enum: ["postgres", "mysql"]
        version:
          type: string
        storage:
          type: object
          properties:
            size:
              type: string
            encrypted:
              type: boolean
```

## Web Search Patterns
- "Crossplane v2.1 XRD scope field"
- "Crossplane v2.1 CompositeResourceDefinition example"
- "Crossplane v2.1 namespaced XRD"