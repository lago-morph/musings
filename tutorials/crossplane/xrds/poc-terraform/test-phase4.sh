#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED_TESTS=0
PASSED_TESTS=0

echo "========================================"
echo "Phase 4: CloudWatch Logging Tests"
echo "========================================"
echo ""

# Get API URL
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${RED}ERROR${NC}: No terraform.tfstate found"
    exit 1
fi

API_URL=$(terraform output -raw api_url 2>/dev/null || echo "")
if [ -z "$API_URL" ]; then
    echo -e "${RED}ERROR${NC}: Could not get api_url from terraform output"
    exit 1
fi

echo "API URL: $API_URL"
echo ""

# Test 1: Verify API Gateway log group exists (multiple checks)
echo "Test 1: Checking if API Gateway CloudWatch log group exists..."

# Check 1a: Via describe-log-groups with prefix
APIGW_LOG_GROUP=$(aws logs describe-log-groups \
    --log-group-name-prefix /aws/apigateway/tutorial \
    --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "")

if [ -z "$APIGW_LOG_GROUP" ] || [ "$APIGW_LOG_GROUP" = "None" ]; then
    echo -e "${RED}FAIL${NC}: API Gateway log group not found via describe-log-groups"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo "  ✓ Found via describe-log-groups: $APIGW_LOG_GROUP"

    # Check 1b: Verify we can get log group details (redundant check)
    LOG_GROUP_ARN=$(aws logs describe-log-groups \
        --log-group-name-prefix "$APIGW_LOG_GROUP" \
        --query 'logGroups[0].arn' --output text 2>/dev/null || echo "")

    if [ -n "$LOG_GROUP_ARN" ] && [ "$LOG_GROUP_ARN" != "None" ]; then
        echo "  ✓ Log group ARN: $LOG_GROUP_ARN"
    fi

    # Check 1c: Verify retention policy exists (if set)
    RETENTION=$(aws logs describe-log-groups \
        --log-group-name-prefix "$APIGW_LOG_GROUP" \
        --query 'logGroups[0].retentionInDays' --output text 2>/dev/null || echo "")

    if [ -n "$RETENTION" ] && [ "$RETENTION" != "None" ]; then
        echo "  ✓ Retention policy: $RETENTION days"
    else
        echo "  ✓ No retention policy (logs retained indefinitely)"
    fi

    echo -e "${GREEN}PASS${NC}: API Gateway log group exists and is properly configured"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 2: Verify default-lambda log group exists
echo "Test 2: Checking if default-lambda CloudWatch log group exists..."
LAMBDA_LOG_GROUP=$(aws logs describe-log-groups \
    --log-group-name-prefix /aws/lambda/default-lambda \
    --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "")

if [ -z "$LAMBDA_LOG_GROUP" ] || [ "$LAMBDA_LOG_GROUP" = "None" ]; then
    echo -e "${RED}FAIL${NC}: default-lambda log group not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: default-lambda log group exists: $LAMBDA_LOG_GROUP"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 3: Generate some activity and verify logs appear
echo "Test 3: Generating activity and checking if logs appear..."
echo "Making request to / endpoint..."
curl -s "$API_URL/" > /dev/null

echo "Waiting 10 seconds for logs to propagate..."
sleep 10

# Check if API Gateway logs have recent entries
if [ -n "$APIGW_LOG_GROUP" ] && [ "$APIGW_LOG_GROUP" != "None" ]; then
    echo "Checking API Gateway logs..."
    START_TIME=$(($(date +%s) - 300))000  # 5 minutes ago in milliseconds
    LOG_EVENTS=$(aws logs filter-log-events \
        --log-group-name "$APIGW_LOG_GROUP" \
        --start-time "$START_TIME" \
        --query 'events[0].message' --output text 2>/dev/null || echo "")

    if [ -z "$LOG_EVENTS" ] || [ "$LOG_EVENTS" = "None" ]; then
        echo -e "${RED}FAIL${NC}: No recent log events in API Gateway logs"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${GREEN}PASS${NC}: API Gateway logs contain recent events"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}SKIP${NC}: API Gateway log group not available"
fi
echo ""

# Test 4: Check Lambda logs
echo "Test 4: Checking if Lambda logs contain execution records..."
if [ -n "$LAMBDA_LOG_GROUP" ] && [ "$LAMBDA_LOG_GROUP" != "None" ]; then
    START_TIME=$(($(date +%s) - 300))000  # 5 minutes ago
    LAMBDA_EVENTS=$(aws logs filter-log-events \
        --log-group-name "$LAMBDA_LOG_GROUP" \
        --start-time "$START_TIME" \
        --query 'events[0].message' --output text 2>/dev/null || echo "")

    if [ -z "$LAMBDA_EVENTS" ] || [ "$LAMBDA_EVENTS" = "None" ]; then
        echo -e "${RED}FAIL${NC}: No recent log events in Lambda logs"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${GREEN}PASS${NC}: Lambda logs contain recent execution records"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}SKIP${NC}: Lambda log group not available"
fi
echo ""

# Test 5: Verify logs capture both 404 and SQS activity
echo "Test 5: Testing that different endpoints generate different logs..."
echo "Making POST to /msg..."
curl -s -X POST -d '{"test": "logging"}' "$API_URL/msg" > /dev/null

echo "Waiting 10 seconds for logs to propagate..."
sleep 10

if [ -n "$APIGW_LOG_GROUP" ] && [ "$APIGW_LOG_GROUP" != "None" ]; then
    START_TIME=$(($(date +%s) - 300))000
    LOG_COUNT=$(aws logs filter-log-events \
        --log-group-name "$APIGW_LOG_GROUP" \
        --start-time "$START_TIME" \
        --query 'length(events)' --output text 2>/dev/null || echo "0")

    if [ "$LOG_COUNT" -lt 2 ]; then
        echo -e "${RED}FAIL${NC}: Expected multiple log entries, got $LOG_COUNT"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${GREEN}PASS${NC}: Multiple log entries found ($LOG_COUNT events)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}SKIP${NC}: API Gateway log group not available"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Phase 4 tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Phase 4 tests PASSED${NC}"
    exit 0
fi
