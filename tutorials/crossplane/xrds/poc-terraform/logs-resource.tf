# Logs Resource Configuration (/log and /logs endpoints)
# This creates two GET endpoints that return CloudWatch log entries
# Both endpoints integrate with the same logs-lambda function
#
# Key concepts:
# - Two separate API Gateway resources pointing to the same Lambda
# - Both use Lambda proxy integration (AWS_PROXY)
# - Only GET method is allowed (POST/PUT/DELETE should be rejected)
# - Each resource needs its own Lambda permission
# - Having two separate paths provides flexibility for future differentiation
#
# IAM Policy Organization:
# - API Gateway needs permission to invoke the logs-lambda function
# - These permissions are defined here (not in logs-lambda.tf) because
#   they're about API Gateway's ability to call Lambda, not Lambda's execution permissions

# Create the /log resource
resource "aws_api_gateway_resource" "log" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  parent_id   = aws_api_gateway_rest_api.tutorial.root_resource_id
  path_part   = "log"
}

# GET method on /log (only GET is allowed, not POST/PUT/DELETE)
resource "aws_api_gateway_method" "log_get" {
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  resource_id   = aws_api_gateway_resource.log.id
  http_method   = "GET"
  authorization = "NONE"
}

# Lambda proxy integration for /log
# This allows the Lambda function to control the full HTTP response
resource "aws_api_gateway_integration" "log_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.tutorial.id
  resource_id             = aws_api_gateway_resource.log.id
  http_method             = aws_api_gateway_method.log_get.http_method
  integration_http_method = "POST" # Lambda integrations always use POST
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.logs_lambda.invoke_arn
}

# Permission for API Gateway to invoke logs-lambda from /log endpoint
resource "aws_lambda_permission" "apigw_log_lambda" {
  statement_id  = "AllowAPIGatewayInvokeLog"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.logs_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The source ARN should be specific to this API Gateway and resource
  source_arn = "${aws_api_gateway_rest_api.tutorial.execution_arn}/*/*/log"
}

# Create the /logs resource (plural)
resource "aws_api_gateway_resource" "logs" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  parent_id   = aws_api_gateway_rest_api.tutorial.root_resource_id
  path_part   = "logs"
}

# GET method on /logs (only GET is allowed, not POST/PUT/DELETE)
resource "aws_api_gateway_method" "logs_get" {
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  resource_id   = aws_api_gateway_resource.logs.id
  http_method   = "GET"
  authorization = "NONE"
}

# Lambda proxy integration for /logs
# This allows the Lambda function to control the full HTTP response
resource "aws_api_gateway_integration" "logs_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.tutorial.id
  resource_id             = aws_api_gateway_resource.logs.id
  http_method             = aws_api_gateway_method.logs_get.http_method
  integration_http_method = "POST" # Lambda integrations always use POST
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.logs_lambda.invoke_arn
}

# Permission for API Gateway to invoke logs-lambda from /logs endpoint
resource "aws_lambda_permission" "apigw_logs_lambda" {
  statement_id  = "AllowAPIGatewayInvokeLogs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.logs_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The source ARN should be specific to this API Gateway and resource
  source_arn = "${aws_api_gateway_rest_api.tutorial.execution_arn}/*/*/logs"
}
