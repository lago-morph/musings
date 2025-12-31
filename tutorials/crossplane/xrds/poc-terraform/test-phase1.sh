#!/bin/bash
set -e

# Phase 1 Test Script - API Gateway Foundation
#
# IMPORTANT LIMITATION:
# Phase 1 alone (api-gateway.tf) CANNOT be deployed by itself!
# AWS API Gateway requires at least ONE method/resource before you can create a deployment.
#
# What this means:
# - You cannot run "terraform apply" with ONLY api-gateway.tf
# - You will get error: "The REST API doesn't contain any methods"
# - You MUST implement Phase 2 (default-lambda.tf + default-resource.tf) first
#
# Why Phase 2 is required:
# - Phase 2 adds the default Lambda function and root resource with ANY method
# - This gives the API Gateway at least one method to deploy
# - Once Phase 2 is implemented, the deployment and stage can be created
# - Then these Phase 1 tests will pass
#
# Testing approach:
# - Implement Phase 1 (api-gateway.tf) - creates REST API only, no deployment yet
# - Implement Phase 2 (default-lambda.tf + default-resource.tf) - adds methods
# - Run "terraform apply" - now deployment succeeds
# - Run test-phase1.sh - verifies API Gateway, stage, and endpoint exist
# - Run test-phase2.sh - verifies Lambda and 404 handler work

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED_TESTS=0
PASSED_TESTS=0

echo "========================================"
echo "Phase 1: API Gateway Foundation Tests"
echo "========================================"
echo ""

# Test 1: Verify API Gateway exists
echo "Test 1: Checking if API Gateway 'tutorial' exists in AWS..."
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`tutorial`].id' --output text)
if [ -z "$API_ID" ]; then
    echo -e "${RED}FAIL${NC}: API Gateway 'tutorial' not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "${GREEN}PASS${NC}: API Gateway 'tutorial' found with ID: $API_ID"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# Test 2: Verify stage exists
# NOTE: This test requires Phase 2 to be implemented!
# The stage depends on the deployment, which requires at least one method/resource.
# Without Phase 2's resources, the deployment cannot be created.
echo "Test 2: Checking if stage 'default' exists..."
if [ -z "$API_ID" ]; then
    echo -e "${YELLOW}SKIP${NC}: Skipping because API Gateway not found"
else
    STAGE_NAME=$(aws apigateway get-stages --rest-api-id "$API_ID" --query 'item[?stageName==`default`].stageName' --output text)
    if [ -z "$STAGE_NAME" ]; then
        echo -e "${RED}FAIL${NC}: Stage 'default' not found"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${GREEN}PASS${NC}: Stage 'default' exists"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi
echo ""

# Test 3: Verify API URL is accessible
# NOTE: This test also requires Phase 2 to be implemented!
# The API URL comes from the stage, which requires the deployment, which requires methods.
echo "Test 3: Checking if API endpoint is publicly accessible..."
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}SKIP${NC}: No terraform.tfstate found, cannot get API URL"
else
    API_URL=$(terraform output -raw api_url 2>/dev/null || echo "")
    if [ -z "$API_URL" ]; then
        echo -e "${RED}FAIL${NC}: Could not get api_url from terraform output"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo "API URL: $API_URL"
        # Try to hit the API (we expect some response, even if it's an error)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")
        if [ "$HTTP_CODE" = "000" ]; then
            echo -e "${RED}FAIL${NC}: Could not connect to API endpoint"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        else
            echo -e "${GREEN}PASS${NC}: API endpoint is accessible (HTTP $HTTP_CODE)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
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
    echo -e "${RED}Phase 1 tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Phase 1 tests PASSED${NC}"
    exit 0
fi
