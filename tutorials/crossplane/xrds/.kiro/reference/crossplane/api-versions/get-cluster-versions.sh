#!/bin/bash
# Script to extract Crossplane API versions from a running Kubernetes cluster
# This is the most reliable way to get current API versions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-/tmp/apiversions}"

echo "Extracting Crossplane API versions from cluster..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed or not in PATH"
    exit 1
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    echo "Please ensure kubectl is configured correctly"
    exit 1
fi

# Create temporary file for processing
TEMP_FILE="/tmp/crossplane-crds-$(date +%s).txt"

# Get all Crossplane CRDs
kubectl get crds -o json | \
    jq -r '.items[] |
        select(.spec.group |
            test("crossplane.io$")) |
        .spec.versions[] |
        select(.served == true) |
        [.name, .deprecated // false] as $ver |
        .storage as $storage |
        .. |
        objects |
        select(has("kind")) |
        .kind as $kind |
        [$kind, $ver[0], $ver[1], $storage]' 2>/dev/null | \
    jq -s 'unique' > "$TEMP_FILE"

# Process the JSON to create the output format
echo -n "" > "$OUTPUT_FILE"

jq -r '.[] |
    . as $item |
    if ($item[2] == true) then
        " \($item[0]) (deprecated)\n\($item[1])\n"
    else
        " \($item[0])\n\($item[1])\n"
    end' "$TEMP_FILE" >> "$OUTPUT_FILE"

# Cleanup
rm -f "$TEMP_FILE"

echo "API versions extracted to: $OUTPUT_FILE"
echo ""
echo "Format:"
echo " Kind"
echo " apiVersion"
echo " (blank line)"
echo ""
echo "Total entries: $(grep -c "crossplane.io" "$OUTPUT_FILE" || true)"
