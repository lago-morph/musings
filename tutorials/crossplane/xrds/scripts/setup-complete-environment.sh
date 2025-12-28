#!/bin/bash

# Complete XRD Tutorial Environment Setup Script
# Automates the entire setup process from SETUP-GUIDE.md
# Uses environment variables for AWS credentials

set -e

echo "🚀 XRD Tutorial Complete Environment Setup"
echo "=========================================="
echo ""

# Source AWS credentials if the config file exists
if [ -f ~/.config/env-mk8-aws ]; then
    echo "📁 Sourcing AWS credentials from ~/.config/env-mk8-aws..."
    source ~/.config/env-mk8-aws
    echo "✅ AWS credentials sourced from config file"
else
    echo "📁 AWS config file ~/.config/env-mk8-aws not found"
    echo "   Will check for environment variables directly..."
fi
echo ""

# Check required environment variables
echo "📋 Checking AWS credentials from environment variables..."

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ ERROR: AWS_ACCESS_KEY_ID environment variable is not set"
    echo "   Please set: export AWS_ACCESS_KEY_ID=your_access_key"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ ERROR: AWS_SECRET_ACCESS_KEY environment variable is not set"
    echo "   Please set: export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

if [ -z "$AWS_DEFAULT_REGION" ]; then
    echo "❌ ERROR: AWS_DEFAULT_REGION environment variable is not set"
    echo "   Please set: export AWS_DEFAULT_REGION=us-east-1"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

# Validate AWS credentials format (basic check)
if [[ ! "$AWS_ACCESS_KEY_ID" =~ ^[A-Z0-9]{20}$ ]]; then
    echo "❌ ERROR: AWS_ACCESS_KEY_ID format appears invalid (should be 20 alphanumeric characters)"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

if [[ ! "$AWS_SECRET_ACCESS_KEY" =~ ^[A-Za-z0-9/+=]{40}$ ]]; then
    echo "❌ ERROR: AWS_SECRET_ACCESS_KEY format appears invalid (should be 40 characters)"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

if [[ ! "$AWS_DEFAULT_REGION" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ ERROR: AWS_DEFAULT_REGION format appears invalid (e.g., us-east-1)"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi

echo "✅ AWS credentials validation passed"
echo "   Access Key: ${AWS_ACCESS_KEY_ID:0:8}..."
echo "   Region: $AWS_DEFAULT_REGION"
echo ""

# Check kubectl access
echo "🔧 Checking Kubernetes cluster access..."
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ ERROR: Cannot access Kubernetes cluster"
    echo "   Please ensure kubectl is configured and cluster is accessible"
    echo "   💡 For troubleshooting: ./scripts/diagnose-setup-issues.sh"
    exit 1
fi
echo "✅ Kubernetes cluster access confirmed"
echo ""

# Step 1: Install Crossplane v2.1+
echo "📦 Step 1: Installing Crossplane v2.1+..."

if kubectl get namespace crossplane-system >/dev/null 2>&1; then
    echo "   Crossplane namespace already exists, checking installation..."
    if kubectl get deployment crossplane -n crossplane-system >/dev/null 2>&1; then
        echo "   ✅ Crossplane already installed"
    else
        echo "   Installing Crossplane in existing namespace..."
        helm repo add crossplane-stable https://charts.crossplane.io/stable
        helm repo update
        helm install crossplane crossplane-stable/crossplane \
          --namespace crossplane-system \
          --version ">=1.14.0"
    fi
else
    echo "   Installing Crossplane..."
    helm repo add crossplane-stable https://charts.crossplane.io/stable
    helm repo update
    helm install crossplane crossplane-stable/crossplane \
      --namespace crossplane-system \
      --create-namespace \
      --version ">=1.14.0"
fi

echo "   ⏳ Waiting for Crossplane to be ready..."
kubectl wait --for=condition=Available deployment crossplane -n crossplane-system --timeout=300s
echo "✅ Crossplane installation complete"
echo ""

# Step 2: Install Upbound AWS Provider Family
echo "🔌 Step 2: Installing Upbound AWS Provider Family..."

echo "   Installing individual AWS service providers..."
kubectl apply -f - <<EOF
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
  name: provider-aws-iam
spec:
  package: xpkg.upbound.io/upbound/provider-aws-iam:v1.14.0
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
EOF

echo "   ⏳ Waiting for AWS providers to be ready (this may take 2-3 minutes)..."
kubectl wait --for=condition=Healthy provider --all --timeout=300s
echo "✅ AWS providers installation complete"
echo ""

# Step 3: Configure AWS Authentication
echo "🔐 Step 3: Configuring AWS authentication..."

# Delete existing secret if it exists
kubectl delete secret aws-secret -n crossplane-system --ignore-not-found=true

# Create AWS credentials secret using environment variables
echo "   Creating AWS credentials secret..."
kubectl create secret generic aws-secret \
  -n crossplane-system \
  --from-literal=credentials="[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY"

# Create ProviderConfig
echo "   Creating ProviderConfig..."
kubectl apply -f - <<EOF
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-secret
      key: credentials
EOF

echo "✅ AWS authentication configured"
echo ""

# Step 4: Configure AWS CLI
echo "🖥️  Step 4: Configuring AWS CLI..."

# Create AWS CLI config directory if it doesn't exist
mkdir -p ~/.aws

# Configure AWS CLI credentials
cat > ~/.aws/credentials <<EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
EOF

# Configure AWS CLI config
cat > ~/.aws/config <<EOF
[default]
region = $AWS_DEFAULT_REGION
output = json
EOF

# Test AWS CLI access
echo "   Testing AWS CLI access..."
if aws sts get-caller-identity >/dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "   ✅ AWS CLI configured successfully (Account: $ACCOUNT_ID)"
else
    echo "   ⚠️  AWS CLI test failed, but continuing with setup..."
fi
echo ""

# Step 5: Run environment restoration
echo "🏗️  Step 5: Running environment restoration..."

if [ -f "./scripts/restore-poc-environment.sh" ]; then
    echo "   Running restoration script..."
    ./scripts/restore-poc-environment.sh
else
    echo "   ❌ ERROR: restore-poc-environment.sh not found"
    echo "   Please ensure you're running this script from the project root directory"
    exit 1
fi

echo ""
echo "🎉 Complete Environment Setup Finished!"
echo "======================================"
echo ""

# Final verification
echo "🔍 Final Verification:"
echo ""

# Check Crossplane
CROSSPLANE_STATUS=$(kubectl get deployment crossplane -n crossplane-system -o jsonpath='{.status.conditions[?(@.type=="Available")].status}')
echo "   Crossplane: $CROSSPLANE_STATUS"

# Check Providers
PROVIDER_COUNT=$(kubectl get providers --no-headers | wc -l)
echo "   AWS Providers: $PROVIDER_COUNT installed"

# Check ProviderConfig
if kubectl get providerconfig default >/dev/null 2>&1; then
    echo "   ProviderConfig: ✅ Configured"
else
    echo "   ProviderConfig: ❌ Not found"
fi

# Check AWS CLI
if aws sts get-caller-identity >/dev/null 2>&1; then
    echo "   AWS CLI: ✅ Working"
else
    echo "   AWS CLI: ❌ Not working"
fi

echo ""
echo "📊 Environment Status:"
if [ -f "./scripts/show-current-status.sh" ]; then
    ./scripts/show-current-status.sh
else
    echo "   Status script not found, checking manually..."
    kubectl get xapiendpoint test-apiendpoint --no-headers 2>/dev/null || echo "   XApiEndpoint test instance not found"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Verify the environment status above"
echo "   2. Continue with task 3.2.4: Create ApiEndpoint instance and verify AWS resources"
echo "   3. Run verification commands:"
echo "      ./scripts/verify-prerequisites.sh"
echo "      kubectl get xapiendpoint test-apiendpoint -o yaml"
echo ""
echo "💡 Troubleshooting:"
echo "   - If providers show as not Healthy, wait a few more minutes"
echo "   - If AWS resources fail to create, check AWS permissions"
echo "   - For detailed logs: kubectl logs -n crossplane-system -l app=crossplane"
echo "   - Run diagnostics: ./scripts/diagnose-setup-issues.sh"