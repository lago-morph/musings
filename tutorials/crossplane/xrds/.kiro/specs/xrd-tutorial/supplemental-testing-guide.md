# Supplemental Testing Guide: Manual ApiEndpoint Validation

## Overview

This guide provides optional instructions for manually testing ApiEndpoint functionality before ApiRoute is created. This is **supplemental content** - the main tutorial does not require these steps.

**When to use this guide**:
- You want to verify ApiEndpoint creates working infrastructure
- You're curious about API Gateway v2 architecture layers
- You want to understand the difference between "created" and "deployed"
- You're troubleshooting ApiEndpoint issues

## Understanding the Architecture

### Why ApiEndpoint Isn't Immediately Testable

ApiEndpoint creates the **foundation** but not the **deployment**:

```
ApiEndpoint Creates:
✅ API Gateway (HTTP API)
✅ Lambda Function  
✅ IAM Role
✅ Integration (connects API Gateway to Lambda)
✅ Default Route ($default - catches unmatched requests)
❌ Stage (required to make routes publicly accessible)
```

**Result**: Infrastructure exists but returns generic API Gateway 404 responses because no Stage is deployed.

### API Gateway v2 Three-Layer Architecture

1. **Routes**: Define URL patterns and connect to integrations
2. **Integrations**: Connect routes to backend services (Lambda, HTTP, etc.)
3. **Stages**: Deploy routes to make them publicly accessible

All three layers are required for end-to-end functionality.

## Manual Testing Procedure

### Prerequisites

- ApiEndpoint XR successfully created and Ready
- AWS CLI configured with appropriate permissions
- `jq` installed for JSON parsing (optional but recommended)

### Step 1: Get API Gateway Information

```bash
# Get the API Gateway ID from your ApiEndpoint
kubectl get xapiendpoint <your-apiendpoint-name> -o jsonpath='{.status.endpointUrl}'
# Example output: https://abc123def.execute-api.us-east-1.amazonaws.com

# Extract the API ID (the part before .execute-api)
API_ID="abc123def"  # Replace with your actual API ID
```

### Step 2: Verify Current State

```bash
# Check existing routes (should show $default route)
aws apigatewayv2 get-routes --api-id $API_ID --no-cli-pager

# Check existing stages (should be empty)
aws apigatewayv2 get-stages --api-id $API_ID --no-cli-pager

# Test current endpoint (should return generic 404)
curl -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/test"
```

**Expected Results**:
- Routes: Shows `$default` route with integration target
- Stages: Empty array `[]`
- Curl: HTTP 404 with generic `{"message":"Not Found"}` response

### Step 3: Create Temporary Stage

```bash
# Create a temporary stage to make routes accessible
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name '$default' \
  --auto-deploy \
  --no-cli-pager
```

### Step 4: Test End-to-End Functionality

```bash
# Test the endpoint (should now reach Lambda)
curl -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/test"

# Check the response body
curl -s "https://$API_ID.execute-api.us-east-1.amazonaws.com/test" | jq .

# Verify HTTP status code
curl -s -o /dev/null -w "%{http_code}" "https://$API_ID.execute-api.us-east-1.amazonaws.com/test"
```

**Expected Results**:
- HTTP Status: `404` (from Lambda, not API Gateway)
- Response Body: Custom message from Lambda function
- Content-Type: `application/json`

### Step 5: Verify Lambda Execution

```bash
# Get Lambda function name
FUNCTION_NAME=$(kubectl get function -o jsonpath='{.items[0].metadata.name}')

# Check if CloudWatch log group was created (indicates Lambda was invoked)
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/$FUNCTION_NAME" \
  --no-cli-pager

# If log group exists, check recent logs
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/$FUNCTION_NAME" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --no-cli-pager
```

### Step 6: Cleanup Temporary Resources

```bash
# Remove the temporary stage
aws apigatewayv2 delete-stage \
  --api-id $API_ID \
  --stage-name '$default' \
  --no-cli-pager

# Verify cleanup (should return empty array)
aws apigatewayv2 get-stages --api-id $API_ID --no-cli-pager

# Verify endpoint returns to generic 404
curl -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/test"
```

## Troubleshooting

### Lambda Function Not Responding

If you get generic API Gateway responses even with a stage:

```bash
# Test Lambda function directly
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{}' \
  response.json \
  --no-cli-pager

# Check response
cat response.json

# If Lambda code is outdated, update it
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --s3-bucket <your-bucket> \
  --s3-key lambda.zip \
  --no-cli-pager
```

### API Gateway Caching Issues

If changes don't appear immediately:

```bash
# Create explicit deployment
aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --no-cli-pager

# Wait a few seconds, then test again
sleep 5
curl -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/test"
```

### Permission Issues

If you get permission errors:

```bash
# Check Lambda permissions
aws lambda get-policy \
  --function-name $FUNCTION_NAME \
  --no-cli-pager

# Check integration configuration
aws apigatewayv2 get-integrations \
  --api-id $API_ID \
  --no-cli-pager
```

## What This Demonstrates

### API Gateway v2 Architecture
- **Separation of Concerns**: Routes vs Integrations vs Stages
- **Deployment Model**: Infrastructure creation vs public accessibility
- **Default Route Behavior**: How `$default` catches unmatched requests

### Crossplane Resource Management
- **Status Propagation**: How Crossplane tracks AWS resource states
- **Resource Dependencies**: How Crossplane manages creation order
- **External Integration**: How Crossplane resources map to AWS APIs

### Real-World Patterns
- **Infrastructure as Code**: Declarative resource management
- **Progressive Deployment**: Foundation first, functionality second
- **Operational Visibility**: Using AWS CLI for troubleshooting

## Connection to Main Tutorial

After completing this manual testing:

1. **ApiRoute Creation**: The main tutorial will create the Stage resource properly through Crossplane
2. **Multi-Route Logic**: ApiRoute will enhance the Lambda to handle specific routes plus default behavior
3. **Production Patterns**: The final result demonstrates real-world API Gateway deployment patterns

This manual testing validates that ApiEndpoint creates correct infrastructure that ApiRoute can build upon.

## Advanced Exploration

### Custom Route Testing

If you want to experiment further:

```bash
# Create a custom route (will be replaced by ApiRoute in main tutorial)
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /api/test' \
  --target integrations/<integration-id> \
  --no-cli-pager

# Test the specific route
curl -X POST -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/api/test"

# Test default route (should still work)
curl -i "https://$API_ID.execute-api.us-east-1.amazonaws.com/other-path"
```

### CloudWatch Metrics

```bash
# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiId,Value=$API_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --no-cli-pager

# Check Lambda metrics  
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --no-cli-pager
```

Remember to clean up any additional resources you create during exploration!