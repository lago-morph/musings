#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get API URL from Terraform
API_URL=$(terraform output -raw api_url 2>/dev/null)
if [ -z "$API_URL" ]; then
    echo -e "${RED}ERROR${NC}: Could not get API URL from terraform output"
    exit 1
fi

# Function to pause and wait for user
pause() {
    echo ""
    echo -e "${CYAN}Press ENTER to continue...${NC}"
    read
    echo ""
}

# Function to show a command and run it
show_and_run() {
    local description="$1"
    local command="$2"

    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$description${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Command:${NC}"
    echo -e "  ${CYAN}$command${NC}"
    echo ""
    echo -e "${BLUE}Output:${NC}"
    echo -e "${GREEN}───────────────────────────────────────────────────────────${NC}"

    # Run the command
    eval "$command"

    echo -e "${GREEN}───────────────────────────────────────────────────────────${NC}"
}

clear

cat << "EOF"
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║        Welcome to the AWS API Gateway Tutorial Tour! 🚀             ║
║                                                                      ║
║  This interactive tour will demonstrate all the features of our     ║
║  API Gateway setup, including:                                      ║
║                                                                      ║
║    • Default 404 handler with friendly HTML                         ║
║    • SQS direct integration for message queueing                    ║
║    • CloudWatch Logs query endpoints                                ║
║    • Proper error handling and method validation                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}API URL: ${GREEN}$API_URL${NC}"
pause

# Demo 1: Default 404 Handler
show_and_run \
    "Demo 1: Accessing the root endpoint (/)

This demonstrates our default Lambda function that returns a friendly
HTML 404 page. The Lambda catches all unmatched routes and provides
a user-friendly error page instead of API Gateway's default error." \
    "curl -s '$API_URL/' | head -20"

pause

# Demo 2: Catch-all for unmatched paths
show_and_run \
    "Demo 2: Accessing an unmatched path (/nonexistent)

Thanks to our {proxy+} resource, ANY path that doesn't match /msg, /log,
or /logs will be caught by the default Lambda and return the same friendly
404 page. Without the proxy resource, this would return a cryptic
'Missing Authentication Token' error." \
    "curl -s '$API_URL/some/random/path' | head -20"

pause

# Demo 3: POST to /msg
show_and_run \
    "Demo 3: Sending a message to the SQS queue via POST /msg

This demonstrates direct API Gateway → SQS integration without Lambda.
The POST body is sent directly to the SQS queue 'tutorial-sqs'.
Notice the 200 response with our success message." \
    "curl -s -X POST -H 'Content-Type: application/json' -d '{\"message\": \"Hello from the tour!\", \"timestamp\": \"$(date -Iseconds)\"}' '$API_URL/msg' | jq ."

pause

# Demo 4: Verify message in SQS
QUEUE_URL=$(terraform output -raw sqs_queue_url 2>/dev/null)
show_and_run \
    "Demo 4: Verifying the message appeared in SQS

Let's check the SQS queue to confirm our message was queued successfully.
We'll retrieve and then delete the message to keep the queue clean." \
    "aws sqs receive-message --queue-url '$QUEUE_URL' --max-number-of-messages 1 | jq -r '.Messages[0].Body' | jq ."

echo ""
echo -e "${YELLOW}Cleaning up the message from the queue...${NC}"
RECEIPT=$(aws sqs receive-message --queue-url "$QUEUE_URL" --max-number-of-messages 1 --query 'Messages[0].ReceiptHandle' --output text 2>/dev/null)
if [ -n "$RECEIPT" ] && [ "$RECEIPT" != "None" ]; then
    aws sqs delete-message --queue-url "$QUEUE_URL" --receipt-handle "$RECEIPT" 2>/dev/null
    echo -e "${GREEN}✓ Message deleted${NC}"
fi

pause

# Demo 5: GET /log endpoint
show_and_run \
    "Demo 5: Querying CloudWatch Logs via GET /log

This demonstrates our logs-lambda function that queries CloudWatch Logs
and returns the last 20 log entries from all application log groups.
The entries are sorted by timestamp (oldest to newest)." \
    "curl -s '$API_URL/log' | jq '[.[] | {datetime, logGroup, message: .message[:80]}] | .[-5:]'"

pause

# Demo 6: GET /logs endpoint
show_and_run \
    "Demo 6: Querying CloudWatch Logs via GET /logs

Both /log and /logs endpoints work identically - they point to the same
logs-lambda function. Having two paths provides flexibility for future
differentiation." \
    "curl -s '$API_URL/logs' | jq 'length'"

echo ""
echo -e "${YELLOW}Note: The /logs endpoint returns the same data as /log${NC}"

pause

# Demo 7: Wrong method to /msg (GET instead of POST)
show_and_run \
    "Demo 7: Attempting GET on /msg (should be rejected)

The /msg endpoint only accepts POST requests. Any other HTTP method
(GET, PUT, DELETE, etc.) will be rejected by API Gateway.
Notice the 403 Forbidden response." \
    "curl -s -w '\nHTTP Status: %{http_code}\n' '$API_URL/msg'"

pause

# Demo 8: Wrong method to /log (POST instead of GET)
show_and_run \
    "Demo 8: Attempting POST on /log (should be rejected)

Similarly, the /log and /logs endpoints only accept GET requests.
POST, PUT, DELETE, etc. will be rejected." \
    "curl -s -w '\nHTTP Status: %{http_code}\n' -X POST '$API_URL/log'"

pause

# Demo 9: Show CloudWatch Log Groups
show_and_run \
    "Demo 9: Listing CloudWatch Log Groups

All components write to dedicated CloudWatch Log Groups:
  • /aws/apigateway/tutorial - API Gateway execution logs
  • /aws/lambda/default-lambda - Default 404 handler logs
  • /aws/lambda/logs-lambda - Log query function logs

This provides comprehensive tracing of all activity." \
    "aws logs describe-log-groups --log-group-name-prefix '/aws/' --query 'logGroups[?contains(logGroupName, \`tutorial\`) || contains(logGroupName, \`lambda\`)].{Name:logGroupName, Retention:retentionInDays}' --output table"

pause

# Demo 10: Recent API Gateway logs
show_and_run \
    "Demo 10: Sampling recent API Gateway execution logs

Let's peek at the most recent API Gateway logs to see the request/response
tracing. These logs capture every request, integration call, and response." \
    "aws logs filter-log-events --log-group-name '/aws/apigateway/tutorial' --max-items 5 --query 'events[*].message' --output text | head -20"

pause

# Final summary
clear
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                    🎉 Tour Complete! 🎉                             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

You've seen all the key features of our AWS API Gateway tutorial setup:

✅ Default 404 Handler
   • Friendly HTML error pages via Lambda
   • Catches all unmatched routes with {proxy+} resource

✅ SQS Direct Integration
   • POST to /msg sends messages directly to SQS (no Lambda!)
   • Proper error handling with selection_pattern
   • Only POST method allowed

✅ CloudWatch Logs Query
   • GET /log and /logs return last 20 log entries
   • Queries all application log groups
   • Only GET method allowed

✅ Comprehensive Logging
   • API Gateway execution logs (full request/response tracing)
   • Lambda function logs (both functions)
   • CloudWatch Logs with 7-day retention

✅ Proper Method Validation
   • Wrong HTTP methods are rejected with 403/404
   • Each endpoint validates its allowed methods

Architecture highlights:
  • REST API (regional)
  • 2 Lambda functions (Python 3.12)
  • 1 SQS queue (standard)
  • 3 CloudWatch Log Groups
  • Direct AWS service integration (SQS)
  • Lambda proxy integration (both Lambdas)

All infrastructure is defined in Terraform and fully reproducible!

EOF

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Thank you for taking the tour!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
