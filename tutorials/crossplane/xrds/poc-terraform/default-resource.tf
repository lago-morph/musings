# Default Resource Configuration
# This creates the catch-all endpoint at "/" that handles any unmatched requests
# It integrates with the default-lambda function to return friendly 404 pages
#
# IMPORTANT: This file handles TWO types of requests:
# 1. Requests to the root path "/" -> handled by the root resource with ANY method
# 2. Requests to unmatched paths like "/randompath" -> handled by the proxy resource {proxy+}
#
# Why we need BOTH resources:
# - The root resource "/" handles requests to the base path
# - The proxy resource "{proxy+}" is a greedy path parameter that catches ALL other paths
# - Without the proxy resource, unmatched paths return 403 "Missing Authentication Token"
# - This was discovered during testing - initially only had root resource, test failed for /randompath
#
# Why we need TWO lambda permissions:
# - Each API Gateway resource needs its own permission to invoke Lambda
# - One permission for the root resource (/)
# - One permission for the proxy resource ({proxy+})
# - Without both permissions, Lambda invocations fail with authorization errors

# API Gateway Method for the root resource (/)
# The root resource is automatically created by API Gateway, we just need to add a method to it
# We use ANY to catch all HTTP methods (GET, POST, PUT, DELETE, etc.)
resource "aws_api_gateway_method" "default" {
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  resource_id   = aws_api_gateway_rest_api.tutorial.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# Integration between API Gateway and the default Lambda function
# This uses Lambda proxy integration, which passes the full request to Lambda
# and allows Lambda to control the entire response (status code, headers, body)
resource "aws_api_gateway_integration" "default_lambda" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_rest_api.tutorial.root_resource_id
  http_method = aws_api_gateway_method.default.http_method

  # Lambda proxy integration - passes full request to Lambda
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.default_lambda.invoke_arn
}

# Permission for API Gateway to invoke the default Lambda function
# Without this, API Gateway will get a 500 error when trying to call the Lambda
resource "aws_lambda_permission" "apigw_default_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.default_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The source ARN is the execution ARN of the API Gateway
  # This grants permission for ANY method on the root resource
  source_arn = "${aws_api_gateway_rest_api.tutorial.execution_arn}/*/*/*"
}

# Catch-all proxy resource for unmatched paths
# The {proxy+} path catches any path that doesn't match other specific resources
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  parent_id   = aws_api_gateway_rest_api.tutorial.root_resource_id
  path_part   = "{proxy+}"
}

# ANY method on the proxy resource (catches all HTTP methods on all unmatched paths)
resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# Integration between the proxy resource and default Lambda
resource "aws_api_gateway_integration" "proxy_lambda" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  # Lambda proxy integration
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.default_lambda.invoke_arn
}

# Permission for API Gateway to invoke the default Lambda from the proxy resource
resource "aws_lambda_permission" "apigw_proxy_lambda" {
  statement_id  = "AllowAPIGatewayInvokeProxy"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.default_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The source ARN specifically for the proxy resource
  source_arn = "${aws_api_gateway_rest_api.tutorial.execution_arn}/*/*/{proxy+}"
}
