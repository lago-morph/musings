# Tutorial Prerequisites Division

## Overview
This document defines the clear division between what the XRD tutorial will teach versus what the environment should already provide. This division ensures the tutorial focuses on Crossplane concepts while assuming appropriate infrastructure foundations.

## Environment Prerequisites (Assumed to Exist)

### 1. Crossplane Platform
- **Crossplane v2.1** installed and running in Kubernetes cluster
- **Upbound AWS Providers** installed and configured:
  - provider-aws-ec2 (v1.14.0)
  - provider-aws-lambda (v1.14.0) 
  - provider-aws-apigatewayv2 (v1.14.0)
  - provider-aws-iam (v1.14.0)
  - provider-aws-cloudwatch (v1.14.0)
- **ProviderConfig** configured with AWS credentials
- **Kubernetes cluster** with kubectl access

### 2. AWS Infrastructure Foundation
- **VPC with public subnet** for Lambda and API Gateway deployment
- **Internet Gateway** and routing configured for public access
- **AWS credentials** configured with appropriate permissions:
  - Lambda: CreateFunction, UpdateFunction, DeleteFunction, InvokeFunction
  - API Gateway: CreateApi, UpdateApi, DeleteApi, CreateRoute, UpdateRoute, DeleteRoute
  - IAM: CreateRole, AttachRolePolicy, DeleteRole, PassRole
  - CloudWatch: GetMetricStatistics, ListMetrics (read-only)
- **AWS region** configured (us-east-1 for consistency)

### 3. Development Tools
- **kubectl** configured for cluster access
- **AWS CLI** configured for verification scripts
- **Docker** for building composition functions (Phase 3 only)

## Tutorial Content (What We Teach)

### 1. XRD Design and Implementation
- **ApiEndpoint XRD**: Schema design, spec fields, status fields
- **ApiRoute XRD**: Schema design with cross-resource references
- **Schema validation**: OpenAPI schema patterns for Crossplane
- **Status field design**: Built-in vs custom status propagation

### 2. Traditional Patch-Based Compositions
- **Composition structure**: Resources, patches, functions
- **Resource templates**: Lambda, API Gateway, IAM resources
- **Patch mechanics**: FromCompositeFieldPath, ToCompositeFieldPath
- **Status propagation**: Using ToCompositeFieldPath for status fields
- **Resource naming**: Using composite metadata for unique names

### 3. Python Composition Functions
- **Function development**: Using crossplane/function-sdk-python
- **Dependency resolution**: Waiting for parent resource readiness
- **Custom status computation**: Calculating derived status fields
- **CloudWatch integration**: Retrieving and processing metrics
- **Error handling**: Graceful failure patterns

### 4. Composite Resource Patterns
- **Parent-child relationships**: ApiEndpoint → ApiRoute dependencies
- **Resource lifecycle**: Creation, updates, deletion ordering
- **Status field mechanics**: How Crossplane propagates status
- **Operational visibility**: Designing meaningful status information

### 5. Integration and Testing
- **Deployment patterns**: Applying XRDs, Compositions, and instances
- **Verification methods**: Using kubectl and AWS CLI for validation
- **Troubleshooting**: Common issues and debugging approaches
- **Status monitoring**: Understanding resource readiness indicators

## Rationale for Division

### Why These Prerequisites Are Assumed

1. **Focus on Learning Objectives**: The tutorial teaches Crossplane concepts, not Kubernetes or AWS setup
2. **Target Audience**: Kubernetes/AWS/Terraform experts already have these skills
3. **Cognitive Load**: Reduces setup complexity to focus on Crossplane patterns
4. **Reusability**: Learners can apply concepts in their existing environments

### Why These Topics Are Taught

1. **Core Crossplane Concepts**: XRDs and Compositions are the heart of Crossplane
2. **Pattern Comparison**: Traditional patches vs functions shows architectural choices
3. **Real-world Relevance**: ApiEndpoint/ApiRoute patterns map to common infrastructure needs
4. **Operational Focus**: Status fields and monitoring are critical for production use

## Implementation Notes

### For Tutorial Development
- All tutorial manifests assume the prerequisite infrastructure exists
- Tutorial code examples reference existing VPC/subnet via selectors
- No tutorial content covers Crossplane installation or AWS setup
- Focus entirely on XRD/Composition patterns and concepts

### For Learner Environment
- Provide prerequisite setup scripts separately from tutorial content
- Include verification scripts to confirm environment readiness
- Document minimum AWS permissions required
- Provide troubleshooting guide for common setup issues

### For Phase 3 Validation
- Use existing poc-manifests/vpc-infrastructure.yaml as prerequisite foundation
- Tutorial manifests will build on this foundation
- Validation scripts will assume this infrastructure is present and ready

## Success Criteria

✅ **Clear Separation**: Tutorial content focuses only on Crossplane concepts
✅ **Appropriate Assumptions**: Prerequisites match target audience capabilities  
✅ **Minimal Cognitive Load**: Learners can focus on learning objectives
✅ **Practical Relevance**: Tutorial patterns apply to real infrastructure needs
✅ **Operational Focus**: Content emphasizes production-ready patterns

This division ensures the tutorial delivers maximum educational value while respecting the expertise and time constraints of the target audience.