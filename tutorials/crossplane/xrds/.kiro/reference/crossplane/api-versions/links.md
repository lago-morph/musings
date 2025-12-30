# Crossplane Core API Reference Links

This file provides direct links to the Crossplane v2.1 API documentation for quick reference without downloading the entire page.

**Base URL**: https://docs.crossplane.io/latest/api

**Last Updated**: 2025-12-29

## Quick Reference by API Kind

### Composition & Resource Definitions (apiextensions.crossplane.io)

| Kind | Current Version | Direct Link |
|------|----------------|-------------|
| CompositeResourceDefinition | v2 | [View Docs](https://docs.crossplane.io/latest/api#CompositeResourceDefinition) |
| Composition | v1 | [View Docs](https://docs.crossplane.io/latest/api#Composition) |
| CompositionRevision | v1 | [View Docs](https://docs.crossplane.io/latest/api#CompositionRevision) |
| EnvironmentConfig | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#EnvironmentConfig) |
| ManagedResourceActivationPolicy | v1alpha1 | [View Docs](https://docs.crossplane.io/latest/api#ManagedResourceActivationPolicy) |
| ManagedResourceDefinition | v1alpha1 | [View Docs](https://docs.crossplane.io/latest/api#ManagedResourceDefinition) |

### Operations (ops.crossplane.io)

| Kind | Current Version | Direct Link |
|------|----------------|-------------|
| CronOperation | v1alpha1 | [View Docs](https://docs.crossplane.io/latest/api#CronOperation) |
| Operation | v1alpha1 | [View Docs](https://docs.crossplane.io/latest/api#Operation) |
| WatchOperation | v1alpha1 | [View Docs](https://docs.crossplane.io/latest/api#WatchOperation) |

### Packages (pkg.crossplane.io)

| Kind | Current Version | Direct Link |
|------|----------------|-------------|
| Configuration | v1 | [View Docs](https://docs.crossplane.io/latest/api#Configuration) |
| ConfigurationRevision | v1 | [View Docs](https://docs.crossplane.io/latest/api#ConfigurationRevision) |
| Function | v1 | [View Docs](https://docs.crossplane.io/latest/api#Function) |
| FunctionRevision | v1 | [View Docs](https://docs.crossplane.io/latest/api#FunctionRevision) |
| Provider | v1 | [View Docs](https://docs.crossplane.io/latest/api#Provider) |
| ProviderRevision | v1 | [View Docs](https://docs.crossplane.io/latest/api#ProviderRevision) |
| DeploymentRuntimeConfig | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#DeploymentRuntimeConfig) |
| ImageConfig | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#ImageConfig) |
| Lock | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#Lock) |

### Protection (protection.crossplane.io)

| Kind | Current Version | Direct Link |
|------|----------------|-------------|
| Usage | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#Usage) |
| ClusterUsage | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#ClusterUsage) |

## Navigation Patterns

### Accessing Specific Fields

Use hierarchical anchor patterns to jump to specific fields:
- **Pattern**: `#[Kind]-[field]-[nestedField]`
- **Example**: `https://docs.crossplane.io/latest/api#Composition-spec-pipeline`

### Common Field Anchors

#### CompositeResourceDefinition v2
- [Spec](https://docs.crossplane.io/latest/api#CompositeResourceDefinition-spec)
- [Spec → Conversion](https://docs.crossplane.io/latest/api#CompositeResourceDefinition-spec-conversion)
- [Spec → Metadata](https://docs.crossplane.io/latest/api#CompositeResourceDefinition-spec-metadata)
- [Spec → Versions](https://docs.crossplane.io/latest/api#CompositeResourceDefinition-spec-versions)
- [Status](https://docs.crossplane.io/latest/api#CompositeResourceDefinition-status)

#### Composition
- [Spec](https://docs.crossplane.io/latest/api#Composition-spec)
- [Spec → Pipeline](https://docs.crossplane.io/latest/api#Composition-spec-pipeline)
- [Spec → Pipeline → FunctionRef](https://docs.crossplane.io/latest/api#Composition-spec-pipeline-functionRef)
- [Spec → Resources](https://docs.crossplane.io/latest/api#Composition-spec-resources)
- [Status](https://docs.crossplane.io/latest/api#Composition-status)

#### Function
- [Spec](https://docs.crossplane.io/latest/api#Function-spec)
- [Spec → Package](https://docs.crossplane.io/latest/api#Function-spec-package)
- [Status](https://docs.crossplane.io/latest/api#Function-status)

## Usage Tips

1. **Quick Lookup**: Use the tables above to jump directly to API kind documentation
2. **Field Details**: Append field names to the anchor for specific field documentation
3. **Version Selection**: The page includes a version selector for v2.1, v2.0, v1.20, or master
4. **YAML Downloads**: Each API kind section includes a link to download the complete CRD YAML

## Alternative Documentation Sources

- **GitHub CRDs**: https://github.com/crossplane/crossplane/tree/master/cluster/crds
- **API Godoc**: https://pkg.go.dev/github.com/crossplane/crossplane
- **Provider APIs**: Check individual provider documentation (e.g., provider-aws, provider-azure)

## Notes

- Anchor links work consistently across versions
- The page structure is stable and can be relied upon for automation
- For local caching, consider downloading specific CRD YAMLs instead of the entire page
- Provider-specific managed resources have separate documentation (not included here)
