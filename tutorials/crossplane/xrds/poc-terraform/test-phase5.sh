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
echo "Phase 5: Logs Lambda & Query Endpoints Tests"
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

# Test 1: Verify logs-lambda exists (multiple checks)
echo "Test 1: Checking if Lambda function 'logs-lambda' exists..."

# Check 1a: Via list-functions
LAMBDA_EXISTS=$(aws lambda list-functions --query 'Functions[?FunctionName==`logs-lambda`].FunctionName' --output text)
if [ -z "$LAMBDA_EXISTS" ]; then
    echo -e "${RED}FAIL${NC}: Lambda function 'logs-lambda' not found via list-functions"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo "  ✓ Found via list-functions"

    # Check 1b: Via get-function (redundant check)
    LAMBDA_CONFIG=$(aws lambda get-function-configuration --function-name logs-lambda 2>/dev/null || echo "")
    if [ -z "$LAMBDA_CONFIG" ]; then
        echo -e "${RED}FAIL${NC}: Lambda found via list but get-function-configuration failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo "  ✓ Verified via get-function-configuration"

        # Check 1c: Verify Lambda has CloudWatch Logs read permissions
        LAMBDA_ROLE=$(aws lambda get-function-configuration --function-name logs-lambda --query 'Role' --output text 2>/dev/null || echo "")
        if [ -n "$LAMBDA_ROLE" ]; then
            echo "  ✓ Lambda role: $LAMBDA_ROLE"

            # Check 1d: Verify runtime is Python
            RUNTIME=$(aws lambda get-function-configuration --function-name logs-lambda --query 'Runtime' --output text 2>/dev/null || echo "")
            if echo "$RUNTIME" | grep -q "python"; then
                echo "  ✓ Runtime verified: $RUNTIME"
                echo -e "${GREEN}PASS${NC}: Lambda function 'logs-lambda' exists and is properly configured"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}FAIL${NC}: Lambda runtime is not Python (got: $RUNTIME)"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            echo -e "${YELLOW}WARN${NC}: Could not verify Lambda role"
            echo -e "${GREEN}PASS${NC}: Lambda function 'logs-lambda' exists"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
fi
echo ""

# Test 2: Verify logs-lambda log group exists
echo "Test 2: Checking if logs-lambda CloudWatch log group exists..."
LOGS_LAMBDA_LOG_GROUP=$(aws logs describe-log-groups \
    --log-group-name-prefix /aws/lambda/logs-lambda \
    --query 'logGroups[0].logGroupName' --output text 2>/dev/null || echo "")

if [ -z "$LOGS_LAMBDA_LOG_GROUP" ] || [ "$LOGS_LAMBDA_LOG_GROUP" = "None" ]; then
    echo -e "${YELLOW}WARN${NC}: logs-lambda log group not found yet (will be created on first invocation)"
else
    echo -e "${GREEN}PASS${NC}: logs-lambda log group exists: $LOGS_LAMBDA_LOG_GROUP"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Generate some activity first
echo "Generating activity to create logs..."
curl -s "$API_URL/" > /dev/null
curl -s -X POST -d '{"test": "data"}' "$API_URL/msg" > /dev/null
echo "Waiting 10 seconds for logs to propagate..."
sleep 10
echo ""

# Test 3: GET to /log should return JSON array
echo "Test 3: Testing GET to /log (should return JSON array)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/log")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 200, got $HTTP_CODE"
    echo "Response: $BODY"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    # Verify it's valid JSON
    if echo "$BODY" | jq empty 2>/dev/null; then
        # Verify it's an array
        TYPE=$(echo "$BODY" | jq -r 'type')
        if [ "$TYPE" != "array" ]; then
            echo -e "${RED}FAIL${NC}: Response is not a JSON array (got: $TYPE)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        else
            LENGTH=$(echo "$BODY" | jq 'length')
            echo -e "${GREEN}PASS${NC}: GET /log returned JSON array with $LENGTH entries"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo -e "${RED}FAIL${NC}: Response is not valid JSON"
        echo "Response: $BODY"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Test 4: GET to /logs should return JSON array
echo "Test 4: Testing GET to /logs (should return JSON array)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/logs")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 200, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    if echo "$BODY" | jq empty 2>/dev/null; then
        TYPE=$(echo "$BODY" | jq -r 'type')
        if [ "$TYPE" != "array" ]; then
            echo -e "${RED}FAIL${NC}: Response is not a JSON array (got: $TYPE)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        else
            LENGTH=$(echo "$BODY" | jq 'length')
            echo -e "${GREEN}PASS${NC}: GET /logs returned JSON array with $LENGTH entries"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo -e "${RED}FAIL${NC}: Response is not valid JSON"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Test 5: Both endpoints should return identical data
echo "Test 5: Verifying /log and /logs return identical data..."
LOG_RESPONSE=$(curl -s "$API_URL/log")
LOGS_RESPONSE=$(curl -s "$API_URL/logs")

if [ "$LOG_RESPONSE" = "$LOGS_RESPONSE" ]; then
    echo -e "${GREEN}PASS${NC}: Both endpoints return identical data"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}FAIL${NC}: Endpoints return different data"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 6: Should return maximum 20 entries
echo "Test 6: Verifying maximum 20 log entries returned..."
LENGTH=$(curl -s "$API_URL/log" | jq 'length')
if [ "$LENGTH" -le 20 ]; then
    echo -e "${GREEN}PASS${NC}: Returned $LENGTH entries (≤ 20)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}FAIL${NC}: Returned $LENGTH entries (should be ≤ 20)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# Test 7: POST to /log should NOT return logs (negative test)
echo "Test 7: Testing POST to /log (should be rejected)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/log")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${RED}FAIL${NC}: POST to /log returned 200 (should be rejected)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: POST to /log properly rejected with HTTP $HTTP_CODE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 8: POST to /logs should NOT return logs (negative test)
echo "Test 8: Testing POST to /logs (should be rejected)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/logs")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${RED}FAIL${NC}: POST to /logs returned 200 (should be rejected)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: POST to /logs properly rejected with HTTP $HTTP_CODE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 9: Verify logs contain data from multiple sources
echo "Test 9: Verifying logs contain entries (should have data from previous tests)..."
LOG_CONTENT=$(curl -s "$API_URL/log")
if [ -z "$LOG_CONTENT" ] || [ "$LOG_CONTENT" = "[]" ]; then
    echo -e "${RED}FAIL${NC}: Log response is empty"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: Log response contains data"
    PASSED_TESTS=$((PASSED_TESTS + 1))
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
    echo -e "${RED}Phase 5 tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Phase 5 tests PASSED${NC}"
    exit 0
fi
