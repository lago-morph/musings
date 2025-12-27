#!/bin/bash

# XRD Tutorial Prerequisites Verification Script
# Verifies that all prerequisite AWS infrastructure is present and ready
# Provides simple "present/missing" output for each component

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
VPC_NAME="xrd-tutorial-vpc"
SUBNET_NAMES=("xrd-tutorial-subnet-public-1a" "xrd-tutorial-subnet-public-1b")
IGW_NAME="xrd-tutorial-igw"
RT_NAME="xrd-tutorial-rt-public"
SG_NAME="xrd-tutorial-lambda-sg"
ROLE_NAME="xrd-tutorial-lambda-base-role"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
check_status() {
    local component="$1"
    local status="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "present" ]; then
        echo -e "${GREEN}✓${NC} $component: present"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $component: missing"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo "=========================================="
echo "XRD Tutorial Prerequisites Verification"
echo "=========================================="
echo "Region: $REGION"
echo "Timestamp: $(date)"
echo ""

# Check AWS CLI configuration
echo "Checking AWS CLI configuration..."
if aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1; then
    CALLER_IDENTITY=$(aws sts get-caller-identity --region "$REGION" --output text --query 'Account')
    echo -e "${GREEN}✓${NC} AWS CLI configured (Account: $CALLER_IDENTITY)"
else
    echo -e "${RED}✗${NC} AWS CLI not configured or no permissions"
    exit 1
fi
echo ""

# Check VPC
echo "Checking VPC infrastructure..."
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --filters "Name=tag:Name,Values=$VPC_NAME" --query 'Vpcs[0].VpcId' --output text 2>/dev/null)
if [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "" ]; then
    check_status "VPC ($VPC_NAME)" "present"
    VPC_STATUS="present"
else
    check_status "VPC ($VPC_NAME)" "missing"
    VPC_STATUS="missing"
fi

# Check Subnets
for subnet_name in "${SUBNET_NAMES[@]}"; do
    SUBNET_ID=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=tag:Name,Values=$subnet_name" --query 'Subnets[0].SubnetId' --output text 2>/dev/null)
    if [ "$SUBNET_ID" != "None" ] && [ "$SUBNET_ID" != "" ]; then
        check_status "Subnet ($subnet_name)" "present"
    else
        check_status "Subnet ($subnet_name)" "missing"
    fi
done

# Check Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways --region "$REGION" --filters "Name=tag:Name,Values=$IGW_NAME" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null)
if [ "$IGW_ID" != "None" ] && [ "$IGW_ID" != "" ]; then
    check_status "Internet Gateway ($IGW_NAME)" "present"
else
    check_status "Internet Gateway ($IGW_NAME)" "missing"
fi

# Check Route Table
RT_ID=$(aws ec2 describe-route-tables --region "$REGION" --filters "Name=tag:Name,Values=$RT_NAME" --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null)
if [ "$RT_ID" != "None" ] && [ "$RT_ID" != "" ]; then
    check_status "Route Table ($RT_NAME)" "present"
    
    # Check if route table has internet route
    INTERNET_ROUTE=$(aws ec2 describe-route-tables --region "$REGION" --route-table-ids "$RT_ID" --query 'RouteTables[0].Routes[?DestinationCidrBlock==`0.0.0.0/0`]' --output text 2>/dev/null)
    if [ "$INTERNET_ROUTE" != "" ]; then
        check_status "Internet Route (0.0.0.0/0)" "present"
    else
        check_status "Internet Route (0.0.0.0/0)" "missing"
    fi
else
    check_status "Route Table ($RT_NAME)" "missing"
    check_status "Internet Route (0.0.0.0/0)" "missing"
fi

echo ""

# Check Security Group
echo "Checking security configuration..."
SG_ID=$(aws ec2 describe-security-groups --region "$REGION" --filters "Name=tag:Name,Values=$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)
if [ "$SG_ID" != "None" ] && [ "$SG_ID" != "" ]; then
    check_status "Lambda Security Group ($SG_NAME)" "present"
else
    check_status "Lambda Security Group ($SG_NAME)" "missing"
fi

echo ""

# Check IAM Role
echo "Checking IAM configuration..."
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null)
    check_status "Lambda Base Role ($ROLE_NAME)" "present"
    
    # Check attached policies
    if aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[?PolicyArn==`arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`]' --output text >/dev/null 2>&1 && [ "$(aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[?PolicyArn==`arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`]' --output text 2>/dev/null)" != "" ]; then
        check_status "Lambda Basic Execution Policy" "present"
    else
        check_status "Lambda Basic Execution Policy" "missing"
    fi
    
    if aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[?PolicyArn==`arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole`]' --output text >/dev/null 2>&1 && [ "$(aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[?PolicyArn==`arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole`]' --output text 2>/dev/null)" != "" ]; then
        check_status "Lambda VPC Access Policy" "present"
    else
        check_status "Lambda VPC Access Policy" "missing"
    fi
else
    check_status "Lambda Base Role ($ROLE_NAME)" "missing"
    check_status "Lambda Basic Execution Policy" "missing"
    check_status "Lambda VPC Access Policy" "missing"
fi

echo ""

# Check CloudWatch permissions (basic test)
echo "Checking CloudWatch permissions..."
if aws cloudwatch list-metrics --region "$REGION" --max-items 1 >/dev/null 2>&1; then
    check_status "CloudWatch Read Access" "present"
else
    check_status "CloudWatch Read Access" "missing"
fi

echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All prerequisites are present and ready!${NC}"
    echo "The environment is ready for XRD tutorial content."
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some prerequisites are missing.${NC}"
    echo "Please ensure all Crossplane manifests are applied and resources are ready."
    echo ""
    echo "To fix missing resources:"
    echo "1. Apply prerequisite infrastructure: kubectl apply -f poc-manifests/prerequisite-infrastructure.yaml"
    echo "2. Wait for resources to become ready: kubectl get managed -l tutorial.crossplane.io/layer=prerequisite"
    echo "3. Re-run this verification script"
    exit 1
fi