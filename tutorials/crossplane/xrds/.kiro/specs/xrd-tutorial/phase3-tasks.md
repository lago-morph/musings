# Phase 3 Technical Validation Tasks

## Overview
Validate core technical assumptions through proof-of-concept implementation before major tutorial content investment. Focus on ApiEndpoint (traditional patches) and ApiRoute (composition functions) patterns.

## Environment Requirements
- Kubernetes cluster with Crossplane v2.1 installed
- AWS provider configured with sandbox AWS account (4-hour auto-cleanup)
- kubectl access configured for cluster operations
- AWS CLI configured for verification scripts
- Docker for building function containers

## Task Progress

### 3.1 Environment Setup & Prerequisites
- [x] 3.1.1 Set up basic VPC configuration for testing
  - Method: Create Crossplane manifests for VPC, subnets, internet gateway
  - Validation: via Crossplane status fields showing Ready
  - Status: COMPLETED - All core infrastructure ready (VPC, subnet, IGW, route table, route)
  - Note: Route table association has selector resolution issue but core networking is functional
- [x] 3.1.2 Determine division between tutorial manifests vs. assumed prerequisites
  - Method: Document what tutorial teaches vs. what environment provides
  - Output: Clear list in markdown format
  - Status: COMPLETED - Created tutorial-prerequisites-division.md with clear separation
- [x] 3.1.3 Create Crossplane manifests for prerequisite infrastructure
  - Method: Write YAML manifests for required AWS infrastructure
  - Validation: via Crossplane status fields showing Ready
  - Status: COMPLETED - All 13 prerequisite resources deployed and showing Ready status
- [x] 3.1.4 Build AWS CLI verification script as secondary confirmation
  - Method: Shell script using AWS CLI with "present/missing" output
  - Purpose: Secondary verification after Crossplane status confirms Ready
  - Language: Shell script only
  - Status: COMPLETED - Both scripts working correctly with deployed infrastructure

### 3.2 ApiEndpoint Proof-of-Concept (Traditional Patches)
- [x] 3.2.1 Implement minimal working ApiEndpoint XRD
  - Method: Create XRD YAML with spec and status schema
  - Validation: via kubectl apply and Crossplane CRD registration
  - Status: COMPLETED - XRD created, applied successfully, and registered with Crossplane
- [x] 3.2.2 Create basic Composition with Lambda + API Gateway + IAM resources
  - Method: Write Composition YAML using traditional patches
  - Resources: Lambda Function, API Gateway API, IAM Role, Lambda Permission
  - Validation: via Crossplane status fields showing Ready
  - Status: COMPLETED - Composition created using Pipeline mode with patch-and-transform function
- [ ] 3.2.3 Test ToCompositeFieldPath status propagation
  - Method: Deploy composition and check status field population
  - Validation: via kubectl get commands on composite resource
  - Status: IN PROGRESS
- [ ] 3.2.4 Create ApiEndpoint instance and verify AWS resources
  - Method: Apply ApiEndpoint CR and check resource creation
  - Validation: via Crossplane status fields and AWS CLI verification
- [ ] 3.2.5 Test API Gateway endpoint responds correctly
  - Method: Use curl over internet to endpoint URL (uses $default route)
  - Note: API Gateway creates default route that accepts all HTTP methods/paths
  - Validation: HTTP 200 response with expected Lambda output
- [ ] 3.2.6 Verify Lambda function executes
  - Method: Check CloudWatch logs after API call
  - Validation: using AWS CLI to query CloudWatch logs

### 3.3 ApiRoute Proof-of-Concept (Composition Functions)
- [ ] 3.3.1 Implement minimal working ApiRoute XRD
  - Method: Create XRD YAML with spec schema including apiEndpointRef
  - Validation: via kubectl apply and Crossplane CRD registration
- [ ] 3.3.2 Create Python Composition Function for dependency resolution
  - Method: Write Python function using crossplane/function-sdk-python
  - Features: Dependency resolution, status computation, CloudWatch integration
  - Language: Python only
- [ ] 3.3.3 Build and deploy function using ttl.sh registry
  - Method: Docker build and push to ttl.sh (anonymous, 24-hour availability)
  - Validation: via docker commands and registry availability
- [ ] 3.3.4 Create Composition using Pipeline mode with function
  - Method: Write Composition YAML using Pipeline with function step
  - Validation: via Crossplane status fields showing Ready
- [ ] 3.3.5 Test function execution and logging
  - Method: Deploy function and trigger execution
  - Validation: using Crossplane function logs via kubectl logs
- [ ] 3.3.6 Validate custom status field computation
  - Method: Check status fields populated by function
  - Validation: via kubectl get commands on composite resource
- [ ] 3.3.7 Test basic CloudWatch integration
  - Method: Function retrieves CloudWatch metrics
  - Validation: using boto3 library in Python test script

### 3.4 Dependency Resolution Validation
- [ ] 3.4.1 Create ApiRoute instance that references ApiEndpoint
  - Method: Apply ApiRoute CR with apiEndpointRef pointing to existing ApiEndpoint
  - Validation: via kubectl apply and resource creation
- [ ] 3.4.2 Verify ApiRoute waits for ApiEndpoint readiness
  - Method: Observe timing and status progression
  - Validation: using kubectl get commands with timestamps
- [ ] 3.4.3 Confirm ApiRoute waits for Lambda ARN availability
  - Method: Check function logs and status fields for dependency resolution
  - Validation: via Crossplane status fields and function logs
- [ ] 3.4.4 Test dependency timing works as specified
  - Method: Monitor resource creation sequence and timing
  - Validation: using kubectl get commands and status observation
- [ ] 3.4.5 Test resource cleanup in correct order
  - Method: Delete ApiRoute first, then ApiEndpoint
  - Validation: using kubectl delete commands and AWS CLI verification

### 3.5 Integration Testing
- [ ] 3.5.1 Deploy complete working example (ApiEndpoint + ApiRoute)
  - Method: Full deployment of both resources with dependencies
  - Validation: via Crossplane status fields showing all Ready
- [ ] 3.5.2 Test live API endpoints respond correctly
  - Method: Send HTTP requests to both default and custom routes
  - Validation: using curl over internet with expected responses
- [ ] 3.5.3 Verify status fields populate with real CloudWatch data
  - Method: Check both built-in and custom status field population
  - Validation: via kubectl get commands on composite resources
- [ ] 3.5.4 Test CloudWatch error handling with mocked failures
  - Method: Create Python unit test with mock library for CloudWatch failures
  - Purpose: Validate graceful error handling without real API manipulation
  - Language: Python with mock library only
- [ ] 3.5.5 Validate end-to-end functionality
  - Method: Complete workflow test from deployment to API calls
  - Validation: via end-to-end shell script with curl and kubectl

## Success Criteria
- All XRDs and Compositions deploy without Crossplane errors
- AWS resources are created as specified in technical specification
- Status fields populate correctly using both built-in and custom approaches
- Dependency resolution timing works as designed
- Basic CloudWatch integration functions with graceful error handling
- Live API endpoints respond correctly to HTTP requests

## Risk Assessment Actions
- If successful: Proceed to Phase 4 (Task Creation) with confidence
- If minor issues: Document fixes needed and proceed with modifications
- If major issues: Revise technical specification and repeat validation

## Deliverables
- Working proof-of-concept manifests for ApiEndpoint and ApiRoute
- AWS verification scripts (shell)
- Python test scripts for CloudWatch integration and error handling
- Technical validation report documenting findings
- Any specification updates needed based on findings

## Important Notes
- Always validate via Crossplane status fields first, then use secondary verification
- Use only Python and shell for all testing and utility scripts
- Confirm with user before marking major task groups (3.1, 3.2, 3.3, 3.4, 3.5) complete
- Always confirm before committing changes to git
- API Gateway automatically creates $default route for testing endpoints
- Focus on educational viability, not production readiness