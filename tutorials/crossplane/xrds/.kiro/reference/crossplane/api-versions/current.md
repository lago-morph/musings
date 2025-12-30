# Crossplane Core API Versions (Current)

This file contains the current API versions for Crossplane core resources. Deprecated APIs are excluded.

**Last Updated**: 2025-12-29

## API Version Reference

| Kind | API Version | Stability |
|------|-------------|-----------|
| ClusterUsage | `protection.crossplane.io/v1beta1` | Beta |
| CompositeResourceDefinition | `apiextensions.crossplane.io/v2` | Stable |
| Composition | `apiextensions.crossplane.io/v1` | Stable |
| CompositionRevision | `apiextensions.crossplane.io/v1` | Stable |
| Configuration | `pkg.crossplane.io/v1` | Stable |
| ConfigurationRevision | `pkg.crossplane.io/v1` | Stable |
| CronOperation | `ops.crossplane.io/v1alpha1` | Alpha |
| DeploymentRuntimeConfig | `pkg.crossplane.io/v1beta1` | Beta |
| EnvironmentConfig | `apiextensions.crossplane.io/v1beta1` | Beta |
| Function | `pkg.crossplane.io/v1` | Stable |
| FunctionRevision | `pkg.crossplane.io/v1` | Stable |
| ImageConfig | `pkg.crossplane.io/v1beta1` | Beta |
| Lock | `pkg.crossplane.io/v1beta1` | Beta |
| ManagedResourceActivationPolicy | `apiextensions.crossplane.io/v1alpha1` | Alpha |
| ManagedResourceDefinition | `apiextensions.crossplane.io/v1alpha1` | Alpha |
| Operation | `ops.crossplane.io/v1alpha1` | Alpha |
| Provider | `pkg.crossplane.io/v1` | Stable |
| ProviderRevision | `pkg.crossplane.io/v1` | Stable |
| Usage | `protection.crossplane.io/v1beta1` | Beta |
| WatchOperation | `ops.crossplane.io/v1alpha1` | Alpha |

## Version Stability Guidelines

- **Stable (v1)**: Production-ready APIs with backward compatibility guarantees
- **Beta (v1beta1, v1beta2)**: Well-tested APIs that may have minor changes before v1
- **Alpha (v1alpha1, v1alpha2)**: Experimental APIs subject to breaking changes

## Deprecated APIs (DO NOT USE)

The following APIs are deprecated and should not be used:
- `CompositeResourceDefinition` - `apiextensions.crossplane.io/v1` (use v2 instead)
- `Usage` - `apiextensions.crossplane.io/v1alpha1` (use protection.crossplane.io/v1beta1)
- `Usage` - `apiextensions.crossplane.io/v1beta1` (use protection.crossplane.io/v1beta1)

## Notes

- When multiple versions exist for a Kind, the most stable version (v1) is listed
- Function and FunctionRevision have both v1 and v1beta1 available; v1 is recommended
- CompositeResourceDefinition v2 is the current version; v1 is deprecated
- Usage has moved from apiextensions.crossplane.io to protection.crossplane.io
