# Upbound Provider Architecture Guide

## Critical Understanding: Provider Families vs Individual Providers

### Key Distinction

**Provider Family ≠ Monolithic Provider Installation**

The `provider-family-aws` is **NOT** a single package that automatically installs all AWS service CRDs. This is a common misunderstanding that leads to missing CRDs and non-functional provider installations.

### Correct Architecture

#### Provider Family Purpose
- **Meta-provider** that manages shared ProviderConfigs
- Provides dependency resolution and version management
- Does **NOT** install service-specific CRDs
- Only provides base `aws.upbound.io` APIs (ProviderConfig, StoreConfig)

#### Individual Service Providers
- **Required** for actual AWS service CRDs (EC2, Lambda, API Gateway, etc.)
- Each service provider installs its own CRDs (e.g., `ec2.aws.upbound.io/v1beta1`)
- Must be installed separately alongside the family provider
- Each runs as its own pod in the cluster

### Installation Requirements

#### Step 1: Remove Conflicting Providers
```bash
# Provider families conflict with monolithic providers
kubectl delete provider provider-aws
```

#### Step 2: Install Individual Service Providers
```yaml
# Install each required service individually
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-ec2
spec:
  package: xpkg.upbound.io/upbound/provider-aws-ec2:v1.14.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-lambda
spec:
  package: xpkg.upbound.io/upbound/provider-aws-lambda:v1.14.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-apigatewayv2
spec:
  package: xpkg.upbound.io/upbound/provider-aws-apigatewayv2:v1.14.0

---
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws-iam
spec:
  package: xpkg.upbound.io/upbound/provider-aws-iam:v1.14.0
```

#### Step 3: Family Provider Auto-Installation
- The first individual provider automatically installs the family provider
- Family provider manages shared ProviderConfig for all services
- No need to manually install `provider-family-aws`

### When Individual Providers Are Necessary

#### Always Required For:
- **Upbound Provider Families**: AWS, GCP, Azure upbound providers
- **Service-Specific CRDs**: When you need specific service APIs
- **Performance Optimization**: Smaller resource footprint per service
- **Granular Control**: Install only needed services

#### Not Required For:
- **Monolithic Providers**: `crossplane-contrib/provider-aws` (legacy)
- **Single-Service Providers**: Providers that only manage one service
- **Community Providers**: Most community providers are still monolithic

### Troubleshooting Guide

#### Symptoms of Incorrect Installation:
- Provider shows `HEALTHY=True` but CRDs missing
- `kubectl api-resources | grep upbound` shows only base APIs
- Error: "no matches for kind X in version Y.aws.upbound.io"

#### Diagnostic Commands:
```bash
# Check what providers are installed
kubectl get providers

# Check available CRDs
kubectl api-resources | grep upbound

# Check provider pods
kubectl get pods -n crossplane-system

# Check provider logs
kubectl logs -n crossplane-system <provider-pod-name>
```

#### Resolution Steps:
1. Remove conflicting monolithic providers
2. Install required individual service providers
3. Wait for CRDs to become available
4. Verify with `kubectl api-resources`

### Version Compatibility

#### Crossplane Requirements:
- **Minimum**: Crossplane v1.12.1 or UXP v1.12.1-up.1
- **Recommended**: Crossplane v2.0+ for full feature support
- **Provider Versions**: Use consistent versions across all services

#### Migration Considerations:
- Cannot run upbound and monolithic providers simultaneously
- Must migrate all resources before switching provider types
- Family providers require different ProviderConfig API versions

### Best Practices

#### For New Installations:
- Always use individual upbound providers for new projects
- Install only required services to minimize resource usage
- Use consistent versions across all providers in the family

#### For Existing Installations:
- Plan migration carefully from monolithic to family providers
- Test in non-production environments first
- Consider using migration tools provided by Upbound

#### For Tutorials and Documentation:
- Always specify whether using monolithic or family providers
- Include complete installation instructions for target provider type
- Test examples with the specified provider architecture

### Common Mistakes to Avoid

1. **Installing provider-family-aws expecting all CRDs**: Family provider only provides base configuration
2. **Mixing monolithic and family providers**: They conflict and family provider won't activate
3. **Assuming automatic service installation**: Each service must be explicitly installed
4. **Using wrong API versions**: Family providers use different API versions than monolithic
5. **Incomplete provider installation**: Missing required services leads to missing CRDs

This guide should prevent future confusion about upbound provider architecture and ensure correct installation procedures.