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
echo "Phase 2: Default Lambda & 404 Handler Tests"
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

# Test 1: Verify Lambda exists (multiple checks)
echo "Test 1: Checking if Lambda function 'default-lambda' exists..."

# Check 1a: Via list-functions
LAMBDA_EXISTS=$(aws lambda list-functions --query 'Functions[?FunctionName==`default-lambda`].FunctionName' --output text)
if [ -z "$LAMBDA_EXISTS" ]; then
    echo -e "${RED}FAIL${NC}: Lambda function 'default-lambda' not found via list-functions"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo "  ✓ Found via list-functions"

    # Check 1b: Via get-function (redundant check)
    LAMBDA_ARN=$(aws lambda get-function --function-name default-lambda --query 'Configuration.FunctionArn' --output text 2>/dev/null || echo "")
    if [ -z "$LAMBDA_ARN" ]; then
        echo -e "${RED}FAIL${NC}: Lambda found via list but get-function failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo "  ✓ Verified via get-function: $LAMBDA_ARN"

        # Check 1c: Verify runtime is Python
        RUNTIME=$(aws lambda get-function --function-name default-lambda --query 'Configuration.Runtime' --output text 2>/dev/null || echo "")
        if echo "$RUNTIME" | grep -q "python"; then
            echo "  ✓ Runtime verified: $RUNTIME"
            echo -e "${GREEN}PASS${NC}: Lambda function 'default-lambda' exists and is properly configured"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}FAIL${NC}: Lambda runtime is not Python (got: $RUNTIME)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
fi
echo ""

# Test 2: GET to / should return 404 HTML
echo "Test 2: Testing GET to / (should return 404 HTML)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 404, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
elif ! echo "$BODY" | grep -qi "html"; then
    echo -e "${RED}FAIL${NC}: Response does not contain HTML content"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: GET / returned 404 with HTML content"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 3: POST to / should return 404 HTML
echo "Test 3: Testing POST to / (should return 404 HTML)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 404, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
elif ! echo "$BODY" | grep -qi "html"; then
    echo -e "${RED}FAIL${NC}: Response does not contain HTML content"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: POST / returned 404 with HTML content"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 4: PUT to / should return 404 HTML
echo "Test 4: Testing PUT to / (should return 404 HTML)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 404, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
elif ! echo "$BODY" | grep -qi "html"; then
    echo -e "${RED}FAIL${NC}: Response does not contain HTML content"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: PUT / returned 404 with HTML content"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 5: DELETE to / should return 404 HTML
echo "Test 5: Testing DELETE to / (should return 404 HTML)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 404, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
elif ! echo "$BODY" | grep -qi "html"; then
    echo -e "${RED}FAIL${NC}: Response does not contain HTML content"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: DELETE / returned 404 with HTML content"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 6: Random path should also return 404 HTML
echo "Test 6: Testing GET to /randompath (should return 404 HTML)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/randompath")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
    echo -e "${RED}FAIL${NC}: Expected HTTP 404, got $HTTP_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
elif ! echo "$BODY" | grep -qi "html"; then
    echo -e "${RED}FAIL${NC}: Response does not contain HTML content"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: GET /randompath returned 404 with HTML content"
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
    echo -e "${RED}Phase 2 tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Phase 2 tests PASSED${NC}"
    exit 0
fi
