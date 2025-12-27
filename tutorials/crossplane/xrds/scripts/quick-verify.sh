#!/bin/bash

# Quick Prerequisites Verification for XRD Tutorial
# Simple present/missing check for core infrastructure components

set -e

REGION="us-east-1"

echo "XRD Tutorial Prerequisites Check"
echo "================================"

# VPC
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --filters "Name=tag:Name,Values=xrd-tutorial-vpc" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")
if [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "" ]; then
    echo "VPC: present"
else
    echo "VPC: missing"
fi

# Subnets
SUBNET_1A=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=tag:Name,Values=xrd-tutorial-subnet-public-1a" --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
if [ "$SUBNET_1A" != "None" ] && [ "$SUBNET_1A" != "" ]; then
    echo "Subnet 1a: present"
else
    echo "Subnet 1a: missing"
fi

SUBNET_1B=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=tag:Name,Values=xrd-tutorial-subnet-public-1b" --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
if [ "$SUBNET_1B" != "None" ] && [ "$SUBNET_1B" != "" ]; then
    echo "Subnet 1b: present"
else
    echo "Subnet 1b: missing"
fi

# Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways --region "$REGION" --filters "Name=tag:Name,Values=xrd-tutorial-igw" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || echo "None")
if [ "$IGW_ID" != "None" ] && [ "$IGW_ID" != "" ]; then
    echo "Internet Gateway: present"
else
    echo "Internet Gateway: missing"
fi

# Security Group
SG_ID=$(aws ec2 describe-security-groups --region "$REGION" --filters "Name=tag:Name,Values=xrd-tutorial-lambda-sg" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")
if [ "$SG_ID" != "None" ] && [ "$SG_ID" != "" ]; then
    echo "Lambda Security Group: present"
else
    echo "Lambda Security Group: missing"
fi

# IAM Role
ROLE_ARN=$(aws iam get-role --role-name "xrd-tutorial-lambda-base-role" --query 'Role.Arn' --output text 2>/dev/null || echo "None")
if [ "$ROLE_ARN" != "None" ] && [ "$ROLE_ARN" != "" ]; then
    echo "Lambda Base Role: present"
else
    echo "Lambda Base Role: missing"
fi

echo "================================"