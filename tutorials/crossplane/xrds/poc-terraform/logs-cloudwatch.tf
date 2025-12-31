# CloudWatch Logs Configuration - Phase 4
# This configures comprehensive logging for all components
# Note: Some parts were added early in Phase 3 for debugging the SQS integration

# CloudWatch Log Group for API Gateway execution logs
# This captures request/response details, integration calls, and errors
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/tutorial"
  retention_in_days = 7

  tags = {
    Name = "tutorial-api-gateway-logs"
  }
}

# CloudWatch Log Group for default-lambda function
# Lambda will automatically use this log group if it exists
resource "aws_cloudwatch_log_group" "default_lambda" {
  name              = "/aws/lambda/default-lambda"
  retention_in_days = 7

  tags = {
    Name = "default-lambda-logs"
  }
}

# CloudWatch Log Group for logs-lambda function
# This Lambda queries other log groups and returns results
resource "aws_cloudwatch_log_group" "logs_lambda" {
  name              = "/aws/lambda/logs-lambda"
  retention_in_days = 7

  tags = {
    Name = "logs-lambda-logs"
  }
}

# IAM role for API Gateway to write to CloudWatch Logs
resource "aws_iam_role" "apigw_cloudwatch" {
  name = "apigw-cloudwatch-role"

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

# IAM policy for CloudWatch Logs
resource "aws_iam_role_policy" "apigw_cloudwatch" {
  name = "apigw-cloudwatch-policy"
  role = aws_iam_role.apigw_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

# API Gateway account settings for CloudWatch
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}
