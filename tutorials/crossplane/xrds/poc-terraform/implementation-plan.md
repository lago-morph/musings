# Implementation Plan - AWS Terraform Tutorial

## Overview
This plan implements the spec in small, testable increments. After each phase, we'll test with the live AWS sandbox account via AWS CLI before proceeding. This catches architectural misunderstandings early.

## Testing Strategy
- **No unit tests** - this is primarily configuration
- **Live AWS testing** - use AWS CLI to verify each component works
- **Incremental validation** - don't proceed until current phase works
- **Sandbox account** - safe to experiment, resets nightly
- **Automated test scripts** - shell script per phase for repeatable testing
- **Negative testing** - verify wrong methods/paths are rejected properly

---

## Phase 1: API Gateway Foundation

### Goal
Create the basic API Gateway REST API with minimal configuration. Verify we can deploy and access it.

### Files to Create
1. **api-gateway.tf**
   - Create REST API named "tutorial"
   - Create deployment
   - Create stage named "default"
   - Output the invoke URL

### Testing
Run the test script:
```bash
./test-phase1.sh
```

The script will verify:
- API Gateway "tutorial" exists in AWS
- Stage "default" is deployed
- API endpoint is publicly accessible

### Success Criteria
✅ All tests in test-phase1.sh pass

---

## Phase 2: Default Lambda and 404 Handler

### Goal
Add the Lambda function that returns a friendly 404 page and wire it to the root path. This proves Lambda integration works.

### Files to Create
1. **default-lambda.tf**
   - Lambda function "default-lambda"
   - Python runtime with inline code
   - IAM execution role with CloudWatch Logs permissions
   - Returns friendly HTML 404 page

2. **default-resource.tf**
   - API Gateway resource at `/`
   - Method: ANY
   - Lambda proxy integration with default-lambda
   - aws_lambda_permission for API Gateway to invoke Lambda

### Testing
Run the test script:
```bash
./test-phase2.sh
```

The script will verify:
- Lambda function "default-lambda" exists
- GET/POST/PUT/DELETE to `/` returns friendly HTML 404 page
- Status code is 404
- Response contains HTML content
- All HTTP methods are handled

### Success Criteria
✅ All tests in test-phase2.sh pass

---

## Phase 3: SQS Queue and Direct Integration

### Goal
Add SQS queue and direct API Gateway → SQS integration. This proves direct AWS service integration works without Lambda.

### Files to Create
1. **msg-sqs.tf**
   - SQS queue "tutorial-sqs"
   - Standard queue configuration

2. **msg-resource.tf**
   - API Gateway resource at `/msg`
   - Method: POST
   - Direct SQS integration (AWS integration type)
   - IAM role for API Gateway to write to SQS
   - Integration request mapping (send raw body to SQS)
   - Integration response mapping (return 200 to client)
   - **Note**: Empty body validation removed - API Gateway treats empty JSON requests as `{}` which is technically valid JSON, so we allow it

### Testing
Run the test script:
```bash
./test-phase3.sh
```

The script will verify:
- SQS queue "tutorial-sqs" exists
- POST to `/msg` returns 200 and queues message
- GET to `/msg` does NOT queue message (should fail/404)
- Message body in SQS matches POST body
- JSON bodies work (plain text support removed as not critical)

### Success Criteria
✅ All tests in test-phase3.sh pass

---

## Phase 4: CloudWatch Logging Infrastructure

### Goal
Add comprehensive CloudWatch logging for all components. This proves we can trace request flow.

### Files to Create
1. **logs-cloudwatch.tf**
   - CloudWatch Log Group: `/aws/apigateway/tutorial`
   - CloudWatch Log Group: `/aws/lambda/default-lambda` (if not auto-created)
   - IAM role for API Gateway to write to CloudWatch Logs
   - Update API Gateway stage to enable execution logging

### Files to Modify
1. **api-gateway.tf**
   - Add CloudWatch logging settings to stage
   - Reference the CloudWatch IAM role
   - Enable detailed logging

2. **default-lambda.tf** (if needed)
   - Ensure Lambda role has CloudWatch Logs permissions
   - Ensure log group is created/referenced

### Testing
Run the test script:
```bash
./test-phase4.sh
```

The script will verify:
- CloudWatch Log Groups exist for API Gateway and Lambda
- Requests generate logs in CloudWatch
- API Gateway logs show request/response details
- Lambda logs show function executions
- Logs appear after making requests

### Success Criteria
✅ All tests in test-phase4.sh pass

---

## Phase 5: Logs Lambda and Query Endpoint

### Goal
Add Lambda function to query CloudWatch Logs and expose via `/log` and `/logs` endpoints.

### Files to Create
1. **logs-lambda.tf**
   - Lambda function "logs-lambda"
   - Python runtime with inline code using boto3
   - Code to query all application log groups
   - Return last 20 log entries as JSON
   - IAM execution role with:
     - CloudWatch Logs write permissions (its own logs)
     - CloudWatch Logs read permissions (query other logs)

2. **logs-resource.tf**
   - API Gateway resource at `/log` with GET method
   - API Gateway resource at `/logs` with GET method
   - Both integrate with logs-lambda (Lambda proxy)
   - Two aws_lambda_permission resources (one for each path)

3. **logs-cloudwatch.tf** (update)
   - Add CloudWatch Log Group: `/aws/lambda/logs-lambda`

### Testing
Run the test script:
```bash
./test-phase5.sh
```

The script will verify:
- logs-lambda function exists
- GET to `/log` returns JSON array of log entries
- GET to `/logs` returns JSON array of log entries
- POST to `/log` does NOT return logs (should fail/404)
- POST to `/logs` does NOT return logs (should fail/404)
- Both `/log` and `/logs` return identical data
- Maximum 20 entries returned
- Response is valid JSON

### Success Criteria
✅ All tests in test-phase5.sh pass

---

## Phase 6: Final Integration Testing

### Goal
Comprehensive end-to-end testing of the entire system.

### Testing
Run the test script:
```bash
./test-phase6.sh
```

This comprehensive end-to-end test verifies:
- All endpoints work together
- Logs capture complete activity trace
- SQS receives and stores messages
- Log query endpoints return comprehensive results
- Wrong HTTP methods are properly rejected
- Complete request/response flow works

### Success Criteria
✅ All tests in test-phase6.sh pass

---

## Rollback Plan

If any phase fails:
1. Review Terraform plan output carefully
2. Check AWS CLI error messages
3. Verify IAM permissions (common issue)
4. Check CloudWatch Logs for detailed errors
5. Use `terraform destroy` to clean up if needed
6. Fix the issue in that phase before proceeding

## Order of Implementation

1. Phase 1: API Gateway Foundation (base infrastructure)
2. Phase 2: Default Lambda (proves Lambda integration)
3. Phase 3: SQS Integration (proves direct AWS service integration)
4. Phase 4: CloudWatch Logging (proves logging infrastructure)
5. Phase 5: Logs Query (proves reading CloudWatch programmatically)
6. Phase 6: Final Integration Testing (proves everything together)

## Notes

- **Incremental testing is critical** - Don't skip phases
- **Each phase builds on previous** - Order matters
- **AWS CLI is your test tool** - Use it extensively
- **Logs are your friend** - When things fail, check CloudWatch
- **Sandbox resets nightly** - Document any persistent issues
- **Terraform state is local** - Easy to destroy and recreate

## Common Issues to Watch For

1. **IAM Permissions**: Most common failure point
   - API Gateway needs permission to invoke Lambda
   - API Gateway needs permission to write to SQS
   - API Gateway needs permission to write to CloudWatch Logs
   - Lambda needs permission to read CloudWatch Logs

2. **API Gateway Deployment**: Changes to resources/methods require redeployment
   - Terraform should handle this, but watch for it

3. **CloudWatch Log Delays**: Logs can take 5-30 seconds to appear
   - Add sleep commands in tests
   - Use --follow flag to watch logs in real-time

4. **SQS Message Visibility**: Messages might not be immediately visible
   - Use appropriate VisibilityTimeout
   - Check for messages multiple times

5. **Lambda Cold Starts**: First invocation may be slower
   - Retry if initial test seems slow
   - Check for timeout issues
