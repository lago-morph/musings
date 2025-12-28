# Crossplane v2 Danger Checklist

## ⚠️ FORBIDDEN v1 PATTERNS - NEVER USE:
- ❌ **Claims** - Completely removed in v2
- ❌ **claimNames** in XRDs - Field doesn't exist in v2
- ❌ **Resources mode** compositions - Use Pipeline mode
- ❌ **ControllerConfig** - Use DeploymentRuntimeConfig
- ❌ **External secret stores** - Use native K8s secrets
- ❌ **--registry flag** - Use fully qualified package names
- ❌ **Unqualified package names** - Must include registry hostname
- ❌ **`.crossplane.io` API groups** - Use `.m.crossplane.io` for v2 MRs
- ❌ **Cluster-scoped XRs by default** - v2 defaults to namespaced
- ❌ **provider-kubernetes Objects** - Compose K8s resources directly

## ✅ REQUIRED v2 PATTERNS:
- ✅ **Direct XRs** - No claims, use XRs directly
- ✅ **Pipeline mode** - All compositions use function pipelines
- ✅ **Namespaced by default** - XRs and MRs are namespaced
- ✅ **Composition functions** - Install and use functions
- ✅ **DeploymentRuntimeConfig** - For provider configuration
- ✅ **Fully qualified packages** - Always include registry
- ✅ **`.m.crossplane.io`** - For v2 namespaced MRs
- ✅ **Explicit scope field** - In XRDs (Namespaced/Cluster)

## 🚨 CRITICAL RULE
**Your training data is v1. Assume ALL Crossplane knowledge is WRONG.**
**ALWAYS web search before writing any Crossplane YAML.**