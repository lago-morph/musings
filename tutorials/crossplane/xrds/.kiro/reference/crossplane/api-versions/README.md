# Crossplane API Version Reference System

This directory contains tools and references for efficiently working with Crossplane API versions without repeatedly downloading large documentation pages.

## Files

### Reference Files
- **`current.md`** - Current API versions with stability levels (manually curated)
- **`links.md`** - Direct links to official documentation for each API kind (no download needed)

### Scripts
- **`get-cluster-versions.sh`** - Extract API versions from your running cluster (most reliable)
- **`refresh-api-versions.sh`** - Fetch latest docs from web (basic structure)

## Recommended Workflow

### Quick Reference (No Downloads)
Use `links.md` to jump directly to specific API documentation:

```bash
# Just open the link in your browser or use WebFetch with the specific anchor
# Example: https://docs.crossplane.io/latest/api#Composition
```

### Get Current Cluster Versions
Extract API versions from your actual cluster (most accurate):

```bash
./get-cluster-versions.sh /tmp/apiversions
# Then process with your preferred tools
```

### Update Local Reference
Periodically update `current.md` with latest versions:

```bash
# Method 1: From cluster (recommended)
./get-cluster-versions.sh
# Then manually update current.md with the results

# Method 2: From web docs
./refresh-api-versions.sh
```

## Usage Patterns

### For Development
1. Use `links.md` for quick documentation lookup during coding
2. Reference `current.md` for API version decisions
3. Always validate against your cluster before deploying

### For Validation
1. Run `get-cluster-versions.sh` to get actual cluster state
2. Compare with `current.md` to identify discrepancies
3. Update manifests if API versions have changed

### For CI/CD
1. Include `get-cluster-versions.sh` in your pipeline
2. Validate manifest API versions match cluster CRDs
3. Fail early if deprecated APIs are detected

## Why This Approach?

### Problems with Downloading Full API Docs
- Page is extremely large (~several MB of HTML)
- Slow to download and parse
- Requires HTML parsing logic
- Content may change structure

### Benefits of This System
- **Direct Links**: Jump to exact documentation section instantly
- **Local Cache**: `current.md` provides quick reference without network calls
- **Cluster Truth**: `get-cluster-versions.sh` gets actual deployed versions
- **No Parsing**: Anchor links work reliably without HTML parsing

## Maintenance

### When to Update
- Before starting new Crossplane projects
- After upgrading Crossplane versions
- When encountering API deprecation warnings
- Monthly as part of routine maintenance

### How to Update
1. Run `get-cluster-versions.sh` against your latest cluster
2. Compare output with `current.md`
3. Update `current.md` with any new API versions
4. Update `links.md` if new API kinds are added
5. Commit changes with note about Crossplane version

## Example: Adding New API Kind

If Crossplane introduces a new API kind:

1. Detect it via cluster extraction:
```bash
./get-cluster-versions.sh
```

2. Add to `current.md`:
```markdown
| NewKind | apiextensions.crossplane.io/v1beta1 | Beta |
```

3. Add to `links.md`:
```markdown
| NewKind | v1beta1 | [View Docs](https://docs.crossplane.io/latest/api#NewKind) |
```

4. Verify the link works in the official documentation

## Integration with Claude Code

When using Claude Code for Crossplane development:

1. Reference `current.md` for correct API versions
2. Use `links.md` for detailed API field documentation
3. Run cluster extraction before major refactoring
4. Update references after Crossplane upgrades

## Notes

- **API Stability**: Always prefer stable (v1) APIs in production
- **Deprecation**: Check for "(deprecated)" markers before using APIs
- **Version Conflicts**: Cluster versions are authoritative over documentation
- **Provider APIs**: This covers Crossplane core only; provider APIs are separate
