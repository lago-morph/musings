# Default Lambda Function Configuration
# This Lambda function returns a friendly 404 HTML page for any unmatched requests
# It serves as the catch-all handler for the API Gateway

# IAM role for the Lambda function
# This role allows Lambda to assume it and grants basic execution permissions
resource "aws_iam_role" "default_lambda" {
  name = "default-lambda-role"

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
}

# IAM policy for CloudWatch Logs
# Allows the Lambda function to write its execution logs to CloudWatch
resource "aws_iam_role_policy" "default_lambda_logs" {
  name = "default-lambda-logs"
  role = aws_iam_role.default_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

# Lambda function for default 404 handler
resource "aws_lambda_function" "default_lambda" {
  filename      = data.archive_file.default_lambda.output_path
  function_name = "default-lambda"
  role          = aws_iam_role.default_lambda.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"

  # The Lambda function code - returns a friendly HTML 404 page
  # This is stored inline using a null_resource to create the zip file
  source_code_hash = data.archive_file.default_lambda.output_base64sha256

  # Timeout and memory settings
  timeout     = 10
  memory_size = 128
}

# Create a zip file with the Lambda code
# Using /tmp for output to avoid cluttering the project directory
data "archive_file" "default_lambda" {
  type        = "zip"
  output_path = "/tmp/default-lambda.zip"

  source {
    content  = <<-EOF
      import json

      def lambda_handler(event, context):
          """
          Returns a friendly HTML 404 page for any request.
          This is a catch-all handler for unmatched API Gateway paths.
          """

          # Friendly HTML 404 page
          html_content = """
          <!DOCTYPE html>
          <html>
          <head>
              <title>404 - Page Not Found</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 100px auto;
                      text-align: center;
                      padding: 20px;
                  }
                  h1 {
                      color: #e74c3c;
                      font-size: 72px;
                      margin: 0;
                  }
                  h2 {
                      color: #34495e;
                  }
                  p {
                      color: #7f8c8d;
                      line-height: 1.6;
                  }
              </style>
          </head>
          <body>
              <h1>404</h1>
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <p>This is a tutorial API with endpoints at /msg, /log, and /logs.</p>
          </body>
          </html>
          """

          # Return the response in API Gateway proxy format
          return {
              'statusCode': 404,
              'headers': {
                  'Content-Type': 'text/html'
              },
              'body': html_content
          }
      EOF
    filename = "index.py"
  }
}
