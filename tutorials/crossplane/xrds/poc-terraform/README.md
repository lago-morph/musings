# AWS Terraform Tutorial - API Gateway + Lambda + SQS

This directory contains a complete specification and implementation plan for a simple AWS infrastructure setup using Terraform.

## What's In This Directory

### Documentation Files

1. **spec.md** - Complete technical specification
   - Architecture diagram
   - Detailed requirements for each component
   - File structure and contents
   - IAM permissions breakdown
   - Success criteria

2. **implementation-plan.md** - Incremental implementation guide
   - 6 phases, each independently testable
   - Build incrementally to catch architectural issues early
   - Detailed testing strategy

3. **idea.md** - Original rough outline (for reference)

### Test Scripts

Automated test scripts for each phase (all executable):

- **test-phase1.sh** - API Gateway foundation tests
- **test-phase2.sh** - Default Lambda & 404 handler tests
- **test-phase3.sh** - SQS queue & direct integration tests
- **test-phase4.sh** - CloudWatch logging tests
- **test-phase5.sh** - Logs Lambda & query endpoints tests
- **test-phase6.sh** - End-to-end integration tests

Each script:
- Clearly states what it's testing
- Runs AWS CLI commands to verify functionality
- Checks results and reports PASS/FAIL
- Includes redundant checks for robustness
- Can be run independently

## What Gets Built

### Architecture Overview

```
Client → API Gateway (REST API) → Three endpoints:
  1. ANY  /      → default-lambda → 404 HTML page
  2. POST /msg   → SQS queue (direct integration)
  3. GET  /log   → logs-lambda → CloudWatch logs (JSON)
  4. GET  /logs  → logs-lambda → CloudWatch logs (JSON)
```

### Key Features

1. **Friendly 404 Handler**
   - Catches all unmatched paths and HTTP methods
   - Returns human-readable HTML error page
   - Always returns 404 status code

2. **Message Queue**
   - Direct API Gateway → SQS integration (no Lambda)
   - Accepts POST requests with raw body
   - Stores messages for processing
   - Rejects empty bodies and wrong methods

3. **Comprehensive Logging**
   - CloudWatch logging for all components
   - Full request/response tracing
   - Dedicated log groups per component
   - Queryable via API endpoints

4. **Log Query API**
   - Two identical endpoints (/log and /logs)
   - Returns last 20 log entries as JSON
   - Queries all application log groups
   - Only GET method allowed

## How to Use This

### 1. Review the Spec

Read `spec.md` to understand what will be built:
```bash
cat spec.md
```

### 2. Follow the Implementation Plan

Follow `implementation-plan.md` phase by phase:

#### Phase 1: API Gateway Foundation
```bash
# Create api-gateway.tf based on spec
terraform init
terraform plan
terraform apply

# Test it
./test-phase1.sh
```

#### Phase 2: Default Lambda
```bash
# Create default-lambda.tf and default-resource.tf
terraform plan
terraform apply

# Test it
./test-phase2.sh
```

#### Phase 3: SQS Integration
```bash
# Create msg-sqs.tf and msg-resource.tf
terraform plan
terraform apply

# Test it
./test-phase3.sh
```

#### Phase 4: CloudWatch Logging
```bash
# Create logs-cloudwatch.tf and update existing files
terraform plan
terraform apply

# Test it
./test-phase4.sh
```

#### Phase 5: Logs Query Endpoints
```bash
# Create logs-lambda.tf and logs-resource.tf
terraform plan
terraform apply

# Test it
./test-phase5.sh
```

#### Phase 6: Integration Testing
```bash
# Run comprehensive end-to-end tests
./test-phase6.sh
```

### 3. Test Incrementally

**IMPORTANT**: Run tests after each phase before proceeding to the next phase. This catches architectural misunderstandings early.

Each test script will:
- Show what it's testing
- Run the tests
- Report clear PASS/FAIL results
- Exit with status 0 (success) or 1 (failure)

### 4. Access Your API

After successful deployment:

```bash
# Get your API URL
API_URL=$(terraform output -raw api_url)

# Test the 404 handler
curl $API_URL/

# Send a message to SQS
curl -X POST -d '{"test": "message"}' $API_URL/msg

# View logs
curl $API_URL/log | jq .
```

## File Structure (To Be Created)

When implementing, you'll create these Terraform files:

```
.
├── api-gateway.tf          # REST API, deployment, stage
├── default-lambda.tf       # 404 handler Lambda function
├── default-resource.tf     # / endpoint configuration
├── msg-sqs.tf             # SQS queue
├── msg-resource.tf        # /msg endpoint configuration
├── logs-cloudwatch.tf     # CloudWatch log groups and configuration
├── logs-lambda.tf         # Log query Lambda function
├── logs-resource.tf       # /log and /logs endpoint configuration
├── variables.tf           # (Optional) Input variables
└── outputs.tf             # (Optional) Output values
```

## Requirements

- Terraform installed
- AWS CLI configured with credentials
- Access to AWS sandbox account
- `jq` installed (for JSON processing in tests)
- `curl` installed (for HTTP requests)

## Important Notes

### State Management
- Terraform state is stored **locally** (no S3 backend)
- State file will be created in this directory
- Easy to destroy and recreate for testing

### AWS Sandbox
- Tests run against live AWS sandbox account
- Sandbox resets nightly
- Safe to experiment
- No production data at risk

### IAM Policy Organization
- IAM policies are co-located with resources that need them
- Example: API Gateway → Lambda permissions go in `default-resource.tf`
- Makes dependencies clear and explicit

### Testing Philosophy
- **No unit tests** - this is configuration, not code
- **Live AWS testing** - verify against real resources
- **Incremental** - test after each phase
- **Comprehensive** - including negative tests (wrong methods, empty bodies)
- **Redundant checks** - verify same thing multiple ways via AWS CLI

## Validation Requirements

### Method Restrictions
- `/` - ANY method allowed (all return 404)
- `/msg` - Only POST allowed (GET/PUT/DELETE rejected)
- `/log` - Only GET allowed (POST/PUT/DELETE rejected)
- `/logs` - Only GET allowed (POST/PUT/DELETE rejected)

### Input Validation
- `/msg` with empty POST body → rejected (no queuing)
- All endpoints validate method before processing

### Response Formats
- `/` → HTML (friendly 404 page)
- `/msg` → Success/error response
- `/log` and `/logs` → JSON array (max 20 entries)

## Success Criteria

When all phases complete successfully, you'll have:

✅ Public REST API accessible via HTTPS
✅ Friendly 404 handler for unmatched routes
✅ Direct SQS integration for message queueing
✅ Comprehensive CloudWatch logging
✅ API endpoints to query logs
✅ Proper HTTP method restrictions
✅ All tests passing

## Troubleshooting

### Tests Failing?

1. Check Terraform apply output for errors
2. Review AWS CloudWatch logs for detailed errors
3. Verify IAM permissions (most common issue)
4. Check the implementation plan's "Common Issues" section
5. Use `terraform destroy` and start fresh if needed

### Common Issues

- **IAM permissions**: Make sure roles have correct policies
- **API Gateway deployment**: Changes require redeployment
- **CloudWatch log delays**: Logs take 5-30 seconds to appear
- **SQS visibility**: Messages may not be immediately visible

## Next Steps

After successful implementation:

1. Experiment with the API
2. Review CloudWatch logs to understand request flow
3. Modify Terraform to add features
4. Use as a learning platform for AWS services

## Clean Up

To remove all resources:

```bash
terraform destroy
```

This will delete:
- API Gateway
- Lambda functions
- SQS queue
- CloudWatch log groups (if configured)
- All associated IAM roles and policies

**Note**: CloudWatch logs may be retained based on retention policy.
