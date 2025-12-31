# API Gateway REST API Configuration
# This creates a public REST API named "tutorial" that will serve as the entry point
# for all our endpoints (/, /msg, /log, /logs)

# Create the REST API
resource "aws_api_gateway_rest_api" "tutorial" {
  name        = "tutorial"
  description = "Tutorial API for learning AWS integrations with Lambda, SQS, and CloudWatch"

  # This is a regional API (not edge-optimized or private)
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Create a deployment
# This is required to make the API accessible - API Gateway changes aren't live until deployed
#
# IMPORTANT: API Gateway deployments require at least ONE method/resource to exist
# - Cannot deploy an empty API (discovered during initial testing)
# - Must use depends_on to ensure methods are created first
# - Must use triggers to redeploy when methods/integrations change
resource "aws_api_gateway_deployment" "tutorial" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id

  # This triggers a new deployment whenever the REST API changes
  # We hash the method configurations to trigger redeployment when they change
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.tutorial.root_resource_id,
      aws_api_gateway_method.default.id,
      aws_api_gateway_integration.default_lambda.id,
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_integration.proxy_lambda.id,
      aws_api_gateway_resource.msg.id,
      aws_api_gateway_method.msg_post.id,
      aws_api_gateway_integration.msg_sqs.id,
      aws_api_gateway_resource.log.id,
      aws_api_gateway_method.log_get.id,
      aws_api_gateway_integration.log_lambda.id,
      aws_api_gateway_resource.logs.id,
      aws_api_gateway_method.logs_get.id,
      aws_api_gateway_integration.logs_lambda.id,
    ]))
  }

  # Ensure the deployment happens after the methods are created
  depends_on = [
    aws_api_gateway_method.default,
    aws_api_gateway_integration.default_lambda,
    aws_api_gateway_method.proxy,
    aws_api_gateway_integration.proxy_lambda,
    aws_api_gateway_method.msg_post,
    aws_api_gateway_integration.msg_sqs,
    aws_api_gateway_method.log_get,
    aws_api_gateway_integration.log_lambda,
    aws_api_gateway_method.logs_get,
    aws_api_gateway_integration.logs_lambda,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Create the "default" stage
# A stage is a snapshot of the API deployment - like dev, staging, prod
# We're using "default" as our single stage name
resource "aws_api_gateway_stage" "default" {
  deployment_id = aws_api_gateway_deployment.tutorial.id
  rest_api_id   = aws_api_gateway_rest_api.tutorial.id
  stage_name    = "default"

  # CloudWatch logging configuration (enabled early for debugging Phase 3)
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format         = "$context.requestId"
  }

  # Enable detailed CloudWatch metrics and logging
  xray_tracing_enabled = false

  # Depends on CloudWatch role being configured
  depends_on = [aws_api_gateway_account.main]
}

# Method settings to enable execution logging
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.tutorial.id
  stage_name  = aws_api_gateway_stage.default.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    data_trace_enabled = true
    metrics_enabled    = true
  }
}

# Output the API URL so we can easily access it
# The URL format is: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
output "api_url" {
  description = "The URL of the deployed API Gateway"
  value       = "${aws_api_gateway_stage.default.invoke_url}"
}

output "api_id" {
  description = "The ID of the REST API"
  value       = aws_api_gateway_rest_api.tutorial.id
}
