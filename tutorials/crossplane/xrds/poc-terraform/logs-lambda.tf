# Logs Lambda Configuration
# This Lambda function queries CloudWatch Logs and returns the last 20 log entries
# from all application log groups as JSON
#
# Key concepts:
# - Uses boto3 CloudWatch Logs client to query logs
# - Queries multiple log groups and aggregates results
# - Returns sorted by timestamp (most recent last)
# - IAM permissions needed for both writing its own logs and reading other logs

# IAM role for the logs-lambda function
resource "aws_iam_role" "logs_lambda" {
  name = "logs-lambda-role"

  # Trust policy - allows Lambda service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "logs-lambda-execution-role"
  }
}

# IAM policy for CloudWatch Logs permissions
resource "aws_iam_role_policy" "logs_lambda_cloudwatch" {
  name = "logs-lambda-cloudwatch-policy"
  role = aws_iam_role.logs_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Write permissions - for the Lambda's own logs
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/logs-lambda:*"
      },
      {
        # Read permissions - to query all application log groups
        Effect = "Allow"
        Action = [
          "logs:FilterLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:/aws/apigateway/tutorial:*",
          "arn:aws:logs:*:*:log-group:/aws/lambda/default-lambda:*",
          "arn:aws:logs:*:*:log-group:/aws/lambda/logs-lambda:*"
        ]
      }
    ]
  })
}

# Create the Lambda function code as a zip file
# Using /tmp for output to avoid cluttering the project directory
data "archive_file" "logs_lambda" {
  type        = "zip"
  output_path = "/tmp/logs-lambda.zip"

  source {
    content = <<-EOF
      import json
      import boto3
      from datetime import datetime

      # CloudWatch Logs client
      logs_client = boto3.client('logs')

      # The log groups we want to query
      LOG_GROUPS = [
          '/aws/apigateway/tutorial',
          '/aws/lambda/default-lambda',
          '/aws/lambda/logs-lambda'
      ]

      def lambda_handler(event, context):
          """
          Query CloudWatch Logs and return the last 20 log entries.

          Returns:
              JSON array of log entries sorted by timestamp (most recent last)
          """
          try:
              all_events = []

              # Query each log group
              for log_group in LOG_GROUPS:
                  try:
                      # Use filter_log_events to get recent events
                      # This API automatically handles pagination and returns events across all streams
                      response = logs_client.filter_log_events(
                          logGroupName=log_group,
                          limit=100  # Get up to 100 events per log group
                      )

                      # Extract and format events
                      for event in response.get('events', []):
                          all_events.append({
                              'timestamp': event['timestamp'],
                              'message': event['message'],
                              'logGroup': log_group,
                              # Convert timestamp to human-readable format
                              'datetime': datetime.fromtimestamp(event['timestamp'] / 1000).isoformat()
                          })

                  except Exception as e:
                      # If a log group doesn't exist or we can't read it, skip it
                      print(f"Warning: Could not read log group {log_group}: {str(e)}")
                      continue

              # Sort by timestamp (oldest first, then we'll reverse to get newest last)
              all_events.sort(key=lambda x: x['timestamp'])

              # Take the last 20 events
              recent_events = all_events[-20:] if len(all_events) > 20 else all_events

              # Return as JSON array (not an object wrapping the array)
              # The test expects just the array, not {"count": N, "events": [...]}
              return {
                  'statusCode': 200,
                  'headers': {
                      'Content-Type': 'application/json'
                  },
                  'body': json.dumps(recent_events, indent=2)
              }

          except Exception as e:
              # Return error response
              print(f"Error querying logs: {str(e)}")
              return {
                  'statusCode': 500,
                  'headers': {
                      'Content-Type': 'application/json'
                  },
                  'body': json.dumps({
                      'error': 'Failed to query logs',
                      'message': str(e)
                  })
              }
      EOF
    filename = "index.py"
  }
}

# Lambda function for querying logs
resource "aws_lambda_function" "logs_lambda" {
  filename         = data.archive_file.logs_lambda.output_path
  function_name    = "logs-lambda"
  role            = aws_iam_role.logs_lambda.arn
  handler         = "index.lambda_handler"
  source_code_hash = data.archive_file.logs_lambda.output_base64sha256
  runtime         = "python3.12"
  timeout         = 30 # Querying logs might take a bit longer

  # Environment variables (none needed for this function)
  environment {
    variables = {
      LOG_GROUPS = join(",", [
        "/aws/apigateway/tutorial",
        "/aws/lambda/default-lambda",
        "/aws/lambda/logs-lambda"
      ])
    }
  }

  tags = {
    Name = "logs-lambda"
  }
}
