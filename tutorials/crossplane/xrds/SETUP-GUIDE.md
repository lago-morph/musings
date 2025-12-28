# XRD Tutorial Environment Setup Guide

This guide helps you recreate the complete POC environment for the XRD tutorial project.

> 🔧 **Having setup issues?** Run `./scripts/diagnose-setup-issues.sh` for comprehensive troubleshooting and solutions.

## Quick Start (Automated Setup)

For a fully automated setup, use the complete environment setup script:

```bash
# Option 1: Use existing AWS config file (recommended)
source ~/.config/env-mk8-aws
./scripts/setup-complete-environment.sh

# Option 2: Set AWS credentials manually
export AWS_ACCESS_KEY_ID="your_access_key_here"
export AWS_SECRET_ACCESS_KEY="your_secret_key_here"
export AWS_DEFAULT_REGION="us-east-1"
./scripts/setup-complete-environment.sh
```

This script automates all the manual steps below. See `./scripts/example-usage.sh` for detailed usage examples.

## Manual Setup (Step by Step)

If you prefer to set up manually or need to troubleshoot, follow these detailed steps:

## Prerequisites

Before running the restoration script, you need:

### 1. Kubernetes Cluster with Crossplane v2.1+

```bash
# Install Crossplane (if not already installed)
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system \
  --create-namespace \
  --version ">=1.14.0"
```

### 2. Upbound AWS Provider Family

Install the individual AWS service providers (NOT the monolithic provider):

```bash
# Install required AWS service providers
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

# Wait for providers to be ready
kubectl wait --for=condition=Healthy provider --all --timeout=300s
```

### 3. AWS Authentication

Configure AWS credentials for Crossplane:

```bash
# Create AWS credentials secret
kubectl create secret generic aws-secret \
  -n crossplane-system \
  --from-literal=credentials='[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY'

# Create ProviderConfig
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
```

### 4. AWS CLI (for verification scripts)

```bash
# Configure AWS CLI with same credentials
aws configure
```

## Environment Restoration

Once prerequisites are met, restore the complete environment:

```bash
# Clone the repository (if needed)
git clone <repository-url>
cd <repository-directory>

# Run the restoration script
./scripts/restore-poc-environment.sh
```

## What Gets Restored

The restoration script recreates:

### 1. Prerequisite AWS Infrastructure
- VPC with dual-AZ subnets
- Internet Gateway and routing
- Security groups
- IAM roles and policies
- All resources showing Ready status

### 2. Crossplane Functions
- function-patch-and-transform (for traditional patches)

### 3. ApiEndpoint POC Components
- XRD (xapiendpoints.tutorial.crossplane.io) - Crossplane v2.1 format
- Composition (apiendpoint-traditional) - Pipeline mode
- Test XApiEndpoint instance (test-apiendpoint)

### 4. Current Task Progress
- Task 3.2.3 (ToCompositeFieldPath status propagation): ✅ COMPLETE
- Ready to continue with task 3.2.4

## Verification

After restoration, verify the environment:

```bash
# Check prerequisite infrastructure
./scripts/verify-prerequisites.sh
./scripts/quick-verify.sh

# Check Crossplane components
kubectl get providers
kubectl get functions
kubectl get crd xapiendpoints.tutorial.crossplane.io
kubectl get composition apiendpoint-traditional

# Check test instance and status propagation
kubectl get xapiendpoint test-apiendpoint -o yaml
```

## Expected Status

After successful restoration:

### ✅ Working Components
- All prerequisite AWS infrastructure (13 resources Ready)
- XRD established and available
- Composition applied and functional
- IAM Role created and Ready
- Status propagation working (iamRoleArn populated)

### ⚠️ Expected Issues
- Lambda Function: Not Ready (missing S3 bucket for code)
- API Gateway: Not Ready (depends on Lambda)

These issues are expected and will be addressed in subsequent tasks.

## Troubleshooting

### Provider Issues
```bash
# Check provider status
kubectl get providers
kubectl describe provider provider-aws-ec2

# Check provider logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws-ec2
```

### Authentication Issues
```bash
# Check ProviderConfig
kubectl get providerconfig default -o yaml

# Test AWS CLI access
aws sts get-caller-identity
```

### Resource Issues
```bash
# Check specific resource status
kubectl describe vpc <vpc-name>
kubectl get events --sort-by='.lastTimestamp'
```

## File Structure

After restoration, your directory structure will be:

```
.
├── SETUP-GUIDE.md                     # This file
├── scripts/
│   ├── restore-poc-environment.sh     # Main restoration script
│   ├── verify-prerequisites.sh        # Infrastructure verification
│   └── quick-verify.sh               # Quick status check
├── poc-manifests/
│   ├── prerequisite-infrastructure.yaml
│   └── README.md
├── poc-validation/
│   └── apiendpoint/
│       ├── README.md                  # Component documentation
│       ├── xrd-apiendpoint.yaml       # XRD (v2.1 format)
│       ├── composition-apiendpoint.yaml # Composition (Pipeline mode)
│       └── test-apiendpoint-instance.yaml # Test XR instance
└── .kiro/
    ├── specs/xrd-tutorial/phase3-tasks.md
    └── steering/critical-workflow-rules.md
```

## Next Steps

After successful restoration:

1. **Verify current state**: Run verification scripts
2. **Continue with task 3.2.4**: Create ApiEndpoint instance and verify AWS resources
3. **Address Lambda issues**: Fix S3 bucket configuration for Lambda code
4. **Complete ApiEndpoint POC**: Get end-to-end API working

## Important Notes

- **Crossplane v2.1**: This environment uses Crossplane v2.1 patterns exclusively
- **No Claims**: Uses direct XR instances, not claims (v1 pattern)
- **Pipeline Mode**: All compositions use Pipeline mode, not Resources mode
- **Upbound Providers**: Uses individual service providers, not monolithic provider
- **4-hour cleanup**: Sandbox environment has auto-cleanup, plan accordingly

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the steering rules in `.kiro/steering/critical-workflow-rules.md`
3. Consult the component documentation in `poc-validation/apiendpoint/README.md`
4. Use web search for Crossplane v2.1 specific patterns (post-training cutoff)