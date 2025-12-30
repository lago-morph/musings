#!/bin/bash
# Script to refresh Crossplane API version information
# This script fetches the latest API documentation and updates current.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_URL="https://docs.crossplane.io/latest/api"
TEMP_FILE="/tmp/crossplane-api-$(date +%s).html"
OUTPUT_FILE="$SCRIPT_DIR/current.md"

echo "Fetching Crossplane API documentation..."
curl -s "$API_URL" -o "$TEMP_FILE"

echo "Extracting API versions from documentation..."

# This is a simple extraction - adjust the parsing logic as needed
# The page structure uses headers and code blocks to identify API kinds and versions

cat > "$OUTPUT_FILE" << 'EOF'
# Crossplane Core API Versions (Current)

This file contains the current API versions for Crossplane core resources. Deprecated APIs are excluded.

**Last Updated**: $(date +%Y-%m-%d)
**Source**: https://docs.crossplane.io/latest/api

## API Version Reference

| Kind | API Version | Stability |
|------|-------------|-----------|
EOF

# Parse the HTML to extract API versions
# Note: This requires additional parsing logic based on the actual HTML structure
# For now, we'll use a placeholder that needs manual update

echo "" >> "$OUTPUT_FILE"
echo "## Version Stability Guidelines" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- **Stable (v1)**: Production-ready APIs with backward compatibility guarantees" >> "$OUTPUT_FILE"
echo "- **Beta (v1beta1, v1beta2)**: Well-tested APIs that may have minor changes before v1" >> "$OUTPUT_FILE"
echo "- **Alpha (v1alpha1, v1alpha2)**: Experimental APIs subject to breaking changes" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Notes" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- This file is auto-generated from the Crossplane API documentation" >> "$OUTPUT_FILE"
echo "- Run this script periodically to check for API updates" >> "$OUTPUT_FILE"
echo "- Always verify API versions against the official documentation before use" >> "$OUTPUT_FILE"

# Cleanup
rm -f "$TEMP_FILE"

echo "API version file updated: $OUTPUT_FILE"
echo ""
echo "NOTE: This script provides basic structure. For detailed parsing,"
echo "consider using kubectl to get actual CRD versions from a running cluster:"
echo ""
echo "  kubectl get crds -o custom-columns=NAME:.metadata.name,VERSION:.spec.versions[*].name | grep crossplane"
