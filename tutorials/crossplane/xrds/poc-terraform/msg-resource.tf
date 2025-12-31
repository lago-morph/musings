# Message Resource Configuration (/msg endpoint)
# This creates a POST endpoint that directly integrates with SQS
# No Lambda function in between - API Gateway sends messages directly to the queue
#
# Key concepts for direct AWS service integration:
# - Integration type is "AWS" (not AWS_PROXY like Lambda)
# - Need to specify the AWS service action (SQS SendMessage)
# - Need IAM role for API Gateway to assume
# - Need request/response mapping templates
# - Need to configure method responses and integration responses
#
# DISCOVERED DURING TESTING:
# - The URI path format is critical: arn:aws:apigateway:{region}:sqs:path/{account}/{queue}
# - The request template must use URL encoding via $util.urlEncode()
# - Must set Content-Type header to application/x-www-form-urlencoded
# - The integration returns 200 even if SQS fails (need CloudWatch logs to debug)

# Get current AWS account ID and region dynamically
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Create the /msg resource
resource "aws_api_gateway_resource" "msg" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  parent_id   = aws_api_gateway_rest_api.tutorial.root_resource_id
  path_part   = "msg"
}

# POST method on /msg (only POST is allowed, not GET/PUT/DELETE)
resource "aws_api_gateway_method" "msg_post" {
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  resource_id   = aws_api_gateway_resource.msg.id
  http_method   = "POST"
  authorization = "NONE"

  # Note: Empty body validation is complex in API Gateway and requires JSON Schema models
  # For this tutorial, we're skipping it - SQS will accept empty bodies
}

# IAM role for API Gateway to assume when calling SQS
resource "aws_iam_role" "apigw_sqs" {
  name = "apigw-sqs-role"

  # Trust policy - allows API Gateway to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })
}

# IAM policy granting permission to send messages to the SQS queue
resource "aws_iam_role_policy" "apigw_sqs_send" {
  name = "apigw-sqs-send"
  role = aws_iam_role.apigw_sqs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:SendMessage"
      ]
      Resource = aws_sqs_queue.tutorial.arn
    }]
  })
}

# Direct AWS integration with SQS
resource "aws_api_gateway_integration" "msg_sqs" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.msg.id
  http_method = aws_api_gateway_method.msg_post.http_method

  # Direct AWS service integration (not proxy)
  type = "AWS"

  # The AWS service to call (SQS SendMessage action)
  # URI format for SQS: arn:aws:apigateway:{region}:sqs:path/{account-id}/{queue-name}
  # We dynamically get the region and account ID from data sources (not hardcoded)
  integration_http_method = "POST"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:sqs:path/${data.aws_caller_identity.current.account_id}/${aws_sqs_queue.tutorial.name}"

  # Credentials - the IAM role API Gateway will assume
  credentials = aws_iam_role.apigw_sqs.arn

  # Request template - transforms the HTTP request into an SQS SendMessage request
  # The template creates a URL-encoded form post with the SQS Action and parameters
  # $util.urlEncode() properly escapes the message body for the URL
  # Since the queue is specified in the URI path, we don't need to include QueueUrl here
  #
  # We support both JSON and plain text content types
  request_templates = {
    "application/json" = "Action=SendMessage&MessageBody=$util.urlEncode($input.body)"
    "text/plain"       = "Action=SendMessage&MessageBody=$util.urlEncode($input.body)"
  }

  # Request parameters to set the content type for SQS
  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-www-form-urlencoded'"
  }

  # Passthrough behavior when no template matches
  passthrough_behavior = "NEVER"
}

# Method response - defines what the method can return to the client
resource "aws_api_gateway_method_response" "msg_200" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.msg.id
  http_method = aws_api_gateway_method.msg_post.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }
}

# Integration response for successful SQS calls (200)
#
# CRITICAL DISCOVERY FROM TESTING:
# Without a selection_pattern, this integration response matches ALL responses from SQS,
# even errors! This meant we were returning HTTP 200 "Message queued successfully" even when:
# - SQS permissions were denied (403)
# - SQS was unavailable (500)
# - Any other SQS error occurred
#
# The bug was discovered by:
# 1. POSTing to /msg and getting 200 response
# 2. Checking SQS queue and finding no messages
# 3. Temporarily denying SQS permissions
# 4. Still getting 200 response (should have been an error!)
#
# The fix: Add selection_pattern to match ONLY successful SQS responses (2xx)
# Now errors from SQS are caught by the msg_error integration response below
resource "aws_api_gateway_integration_response" "msg_200" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.msg.id
  http_method = aws_api_gateway_method.msg_post.http_method
  status_code = aws_api_gateway_method_response.msg_200.status_code

  # Selection pattern - only match successful SQS responses (2xx status codes)
  # This ensures we only return 200 when SQS actually succeeded
  selection_pattern = "^2[0-9][0-9]"

  # Response template - transforms the SQS response into an HTTP response
  response_templates = {
    "application/json" = <<EOF
{
  "message": "Message queued successfully"
}
EOF
  }

  # Depends on the integration being created first
  depends_on = [aws_api_gateway_integration.msg_sqs]
}

# Method response for errors (500)
resource "aws_api_gateway_method_response" "msg_500" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.msg.id
  http_method = aws_api_gateway_method.msg_post.http_method
  status_code = "500"

  response_models = {
    "application/json" = "Error"
  }
}

# Integration response for SQS errors (4xx/5xx)
# This catches any error responses from SQS and returns 500 to the client
resource "aws_api_gateway_integration_response" "msg_error" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.msg.id
  http_method = aws_api_gateway_method.msg_post.http_method
  status_code = aws_api_gateway_method_response.msg_500.status_code

  # Selection pattern - match any 4xx or 5xx error from SQS
  selection_pattern = "[45][0-9][0-9]"

  # Response template for errors
  response_templates = {
    "application/json" = <<EOF
{
  "error": "Failed to queue message"
}
EOF
  }

  depends_on = [aws_api_gateway_integration.msg_sqs]
}
