# SQS Queue Configuration
# This creates a standard SQS queue that receives messages from the /msg endpoint
# Messages are sent directly from API Gateway (no Lambda in between)

# Create the SQS queue
resource "aws_sqs_queue" "tutorial" {
  name = "tutorial-sqs"

  # Standard queue configuration (not FIFO)
  # Standard queues provide best-effort ordering and at-least-once delivery
  fifo_queue = false

  # Message retention period - how long messages stay in queue if not processed
  # Default is 4 days (345600 seconds), we'll use the default
  message_retention_seconds = 345600

  # Visibility timeout - how long a message is invisible after being received
  # This prevents other consumers from processing the same message
  # Default is 30 seconds, which is fine for our tutorial
  visibility_timeout_seconds = 30

  # Maximum message size in bytes (256 KB is the max for SQS)
  max_message_size = 262144

  # Delay before messages become available (0 = immediate)
  delay_seconds = 0

  # Enable server-side encryption using AWS managed keys
  # This is a security best practice
  sqs_managed_sse_enabled = true

  # Tags for the queue
  tags = {
    Name        = "tutorial-sqs"
    Description = "Queue for tutorial API /msg endpoint"
    ManagedBy   = "Terraform"
  }
}

# Output the queue URL for easy reference
output "sqs_queue_url" {
  description = "The URL of the SQS queue"
  value       = aws_sqs_queue.tutorial.url
}

# Output the queue ARN (needed for IAM permissions)
output "sqs_queue_arn" {
  description = "The ARN of the SQS queue"
  value       = aws_sqs_queue.tutorial.arn
}
