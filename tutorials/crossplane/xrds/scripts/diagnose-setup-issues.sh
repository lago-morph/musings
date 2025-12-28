#!/bin/bash

# Diagnose Setup Issues Script
# Helps troubleshoot common Crossplane and AWS provider setup problems

echo "🔍 XRD Tutorial Setup Diagnostics"
echo "=================================="
echo ""

# Check AWS credentials
echo "📋 AWS Credentials Check:"
if aws sts get-caller-identity >/dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    echo "   ✅ AWS CLI working (Account: $ACCOUNT_ID, Region: $REGION)"
else
    echo "   ❌ AWS CLI not working"
    echo "   Run: source ~/.config/env-mk8-aws"
fi
echo ""

# Check Kubernetes access
echo "🔧 Kubernetes Access:"
if kubectl cluster-info >/dev/null 2>&1; then
    echo "   ✅ kubectl access working"
else
    echo "   ❌ kubectl access failed"
    echo "   Check your kubeconfig"
fi
echo ""

# Check Crossplane installation
echo "📦 Crossplane Installation:"
if kubectl get deployment crossplane -n crossplane-system >/dev/null 2>&1; then
    CROSSPLANE_STATUS=$(kubectl get deployment crossplane -n crossplane-system -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')
    echo "   ✅ Crossplane installed (Available: $CROSSPLANE_STATUS)"
else
    echo "   ❌ Crossplane not installed"
    echo "   Run the setup script to install"
fi
echo ""

# Check AWS Providers
echo "🔌 AWS Providers:"
PROVIDER_COUNT=$(kubectl get providers --no-headers 2>/dev/null | wc -l)
if [ "$PROVIDER_COUNT" -gt 0 ]; then
    echo "   ✅ $PROVIDER_COUNT providers installed"
    kubectl get providers --no-headers | while read line; do
        echo "      $line"
    done
    
    # Check for unhealthy providers
    UNHEALTHY=$(kubectl get providers -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Healthy")].status=="False")].metadata.name}')
    if [ -n "$UNHEALTHY" ]; then
        echo "   ⚠️  Unhealthy providers: $UNHEALTHY"
    fi
else
    echo "   ❌ No providers installed"
fi
echo ""

# Check AWS Secret
echo "🔐 AWS Authentication:"
if kubectl get secret aws-secret -n crossplane-system >/dev/null 2>&1; then
    echo "   ✅ AWS secret exists"
    
    # Check secret keys
    KEYS=$(kubectl get secret aws-secret -n crossplane-system -o jsonpath='{.data}' | jq -r 'keys[]' 2>/dev/null)
    echo "   Secret keys: $KEYS"
    
    # Check if it has the right key
    if kubectl get secret aws-secret -n crossplane-system -o jsonpath='{.data.credentials}' >/dev/null 2>&1; then
        echo "   ✅ Secret has 'credentials' key"
    else
        echo "   ❌ Secret missing 'credentials' key"
        echo "   This is the most common setup issue!"
    fi
else
    echo "   ❌ AWS secret not found"
fi
echo ""

# Check ProviderConfig
echo "🔧 ProviderConfig:"
if kubectl get providerconfigs.aws.upbound.io default >/dev/null 2>&1; then
    echo "   ✅ ProviderConfig exists"
    
    # Check ProviderConfig details
    SECRET_NAME=$(kubectl get providerconfigs.aws.upbound.io default -o jsonpath='{.spec.credentials.secretRef.name}')
    SECRET_KEY=$(kubectl get providerconfigs.aws.upbound.io default -o jsonpath='{.spec.credentials.secretRef.key}')
    echo "   References secret: $SECRET_NAME, key: $SECRET_KEY"
    
    if [ "$SECRET_KEY" != "credentials" ]; then
        echo "   ⚠️  ProviderConfig uses key '$SECRET_KEY' but should use 'credentials'"
    fi
else
    echo "   ❌ ProviderConfig not found"
fi
echo ""

# Check VPC status (key indicator)
echo "🏗️  Infrastructure Status:"
if kubectl get vpc >/dev/null 2>&1; then
    VPC_STATUS=$(kubectl get vpc --no-headers | head -1)
    echo "   VPC: $VPC_STATUS"
    
    # Check for common VPC errors
    VPC_NAME=$(kubectl get vpc --no-headers | head -1 | awk '{print $1}')
    if [ -n "$VPC_NAME" ]; then
        VPC_ERROR=$(kubectl get vpc "$VPC_NAME" -o jsonpath='{.status.conditions[?(@.type=="Synced")].message}' 2>/dev/null)
        if [[ "$VPC_ERROR" == *"credentials"* ]]; then
            echo "   ❌ VPC has credential error: $VPC_ERROR"
            echo "   This indicates AWS authentication is not working"
        fi
    fi
else
    echo "   ❌ No VPC resources found"
fi
echo ""

# Check Functions
echo "🔧 Crossplane Functions:"
if kubectl get functions.pkg.crossplane.io >/dev/null 2>&1; then
    FUNC_COUNT=$(kubectl get functions.pkg.crossplane.io --no-headers | wc -l)
    echo "   ✅ $FUNC_COUNT functions installed"
    kubectl get functions.pkg.crossplane.io --no-headers | while read line; do
        echo "      $line"
    done
else
    echo "   ❌ No functions installed"
fi
echo ""

# Common Issues Summary
echo "🚨 Common Issues and Solutions:"
echo ""
echo "1. VPC not syncing with credential errors:"
echo "   → Check AWS secret has 'credentials' key (not 'creds')"
echo "   → Run: kubectl delete secret aws-secret -n crossplane-system"
echo "   → Run: source ~/.config/env-mk8-aws && ./scripts/setup-complete-environment.sh"
echo ""
echo "2. Providers not healthy:"
echo "   → Wait 2-3 minutes for providers to download and start"
echo "   → Check logs: kubectl logs -n crossplane-system -l app=crossplane"
echo ""
echo "3. Functions not working:"
echo "   → Check function status: kubectl get functions.pkg.crossplane.io"
echo "   → Wait for Healthy status before applying compositions"
echo ""
echo "4. Resources stuck in 'Creating' state:"
echo "   → Check AWS permissions for the service"
echo "   → Verify AWS region matches configuration"
echo "   → Check resource dependencies (VPC before subnets, etc.)"
echo ""

# Quick fix suggestions
echo "🔧 Quick Fixes:"
echo ""
echo "Reset AWS authentication:"
echo "   kubectl delete secret aws-secret -n crossplane-system"
echo "   source ~/.config/env-mk8-aws"
echo "   ./scripts/setup-complete-environment.sh"
echo ""
echo "Check provider logs:"
echo "   kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws-ec2"
echo ""
echo "Restart Crossplane:"
echo "   kubectl rollout restart deployment crossplane -n crossplane-system"