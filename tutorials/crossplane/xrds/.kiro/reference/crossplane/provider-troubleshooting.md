# Provider Troubleshooting for Crossplane v2

## Individual vs Family Provider Architecture

### The Problem
**Provider Family ≠ Monolithic Provider Installation**

The `provider-family-aws` is **NOT** a single package that installs all AWS service CRDs. This is the most common source of "missing CRDs" errors.

### Correct Architecture
- **Family Provider**: Manages shared ProviderConfigs (auto-installed)
- **Individual Service Providers**: Required for actual CRDs (must install manually)

### Required Installation Pattern
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
  name: provider-aws-lambda
spec:
  package: xpkg.upbound.io/upbound/provider-aws-lambda:v1.14.0
```

## Common Symptoms and Fixes

### "No matches for kind X in version Y.aws.upbound.io"
**Cause**: Missing individual service provider
**Fix**: Install the specific service provider (e.g., provider-aws-s3)

### Provider shows HEALTHY=True but CRDs missing
**Cause**: Only family provider installed, no individual services
**Fix**: Install individual service providers

### "Package not found" errors
**Cause**: Using unqualified package names
**Fix**: Use fully qualified names with registry hostname

## Diagnostic Commands

### Check What's Installed
```bash
kubectl get providers
kubectl get functions
```

### Check Available CRDs
```bash
kubectl api-resources | grep upbound
kubectl api-resources | grep m.crossplane.io
```

### Check Provider Pods
```bash
kubectl get pods -n crossplane-system
kubectl logs -n crossplane-system <provider-pod-name>
```

### Verify Provider Health
```bash
kubectl describe provider <provider-name>
```

## Quick Resolution Steps
1. **Remove conflicting monolithic providers** (if any)
2. **Install required individual service providers**
3. **Wait for CRDs to become available** (30-60 seconds)
4. **Verify with `kubectl api-resources`**

## Version Compatibility
- **Minimum**: Crossplane v1.12.1 or UXP v1.12.1-up.1
- **Recommended**: Crossplane v2.0+ for full v2 feature support
- **Provider Versions**: Use consistent versions across all services in a family