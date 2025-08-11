# AWS Lambda Deployment Guide

This guide explains how to deploy the video transcription service as an AWS Lambda function using Docker containers.

## Overview

The project supports multiple deployment strategies:
- **Traditional Docker**: For standard container deployments
- **AWS Lambda**: For serverless deployments with automatic scaling
- **GitHub Pages**: For static frontend hosting

## Lambda-Specific Configuration

### Dockerfile Multi-Stage Build

The `Dockerfile` includes a dedicated `lambda` stage optimized for AWS Lambda:

```dockerfile
# AWS Lambda stage (optimized for Lambda runtime)
FROM public.ecr.aws/lambda/nodejs:20 AS lambda
```

Key features:
- Uses AWS Lambda's official Node.js 20 runtime
- Optimized for cold start performance
- Includes serverless-http integration
- Proper environment variable handling

### Lambda Handler

The Lambda handler (`server/src/utils/lambda-handler.ts`) provides comprehensive event processing:

#### ✅ **Authorization Requests**
- API Gateway authorizer integration
- API key validation for secured endpoints
- Dynamic policy generation based on request path
- Support for both TOKEN and REQUEST authorizer types

#### ✅ **API Requests**
- HTTP request/response handling via Express integration
- Serverless-http adapter for seamless conversion
- Full API endpoint support (transcriptions, users, payments, notifications)
- CORS and error handling

#### ✅ **SQS Message Processing**
- Asynchronous message queue handling
- Support for multiple message types:
  - `transcription_request`: Process video transcription requests
  - `transcription_completed`: Create completion notifications
  - `notification_send`: Send verification and password reset emails
  - `user_sync`: Synchronize user data from Cognito
- Automatic retry mechanism for failed messages
- Proper error handling to prevent infinite loops

#### Additional Event Types
- **EventBridge Support**: Handles scheduled events and custom triggers

## AWS Secrets Manager Integration

The application now uses AWS Secrets Manager for secure credential management:

### Required AWS Secrets

#### 1. Database Credentials: `dev/video-transcript/db`
```json
{
  "username": "dbmasteruser",
  "password": "your_db_password", 
  "engine": "postgres",
  "host": "your-rds-endpoint.amazonaws.com",
  "port": "5432",
  "dbname": "video-transcript"
}
```

#### 2. SMTP Credentials: `dev/FrontEnd/ses`
```json
{
  "host": "email-smtp.us-east-1.amazonaws.com",
  "port": "587", 
  "user": "your_smtp_username",
  "password": "your_smtp_password"
}
```

### Environment Variables

With AWS Secrets Manager, you only need these environment variables:

```bash
# AWS Configuration (Required)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# SQS Queue
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/account/queue

# Payment APIs (Still required)
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Frontend URL for CORS
FRONTEND_URL=https://yourusername.github.io
```

**Security Benefits:**
- Database passwords are never stored in environment variables
- SMTP credentials are securely managed by AWS
- Automatic rotation support through Secrets Manager
- IAM-based access control

## Build Instructions

### 1. Build Lambda Container

```bash
# Build the Lambda-optimized container
docker build --target lambda -t video-transcript-lambda .

# Or use Docker Compose
docker-compose -f docker-compose.lambda.yml build
```

### 2. Test Locally

```bash
# Test with Lambda Runtime Interface Emulator
docker-compose -f docker-compose.lambda.yml up

# Test API requests
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"httpMethod": "GET", "path": "/health", "headers": {}}'

# Test SQS messages
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "Records": [{
      "eventSource": "aws:sqs",
      "messageId": "test-123",
      "body": "{\"type\": \"transcription_request\", \"data\": {\"transcriptionId\": \"test-456\"}}"
    }]
  }'

# Test authorization requests
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "type": "REQUEST",
    "authorizationToken": "api-key-12345",
    "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/transcriptions"
  }'
```

### 3. Deploy to AWS

#### Option A: AWS Lambda Console

1. Create a new Lambda function
2. Choose "Container image" as the package type
3. Upload the `video-transcript-lambda` image to ECR
4. Configure environment variables (see below)
5. Set up API Gateway integration

#### Option B: AWS CLI

```bash
# Create ECR repository
aws ecr create-repository --repository-name video-transcript-lambda

# Build and tag for ECR
docker build --target lambda -t video-transcript-lambda .
docker tag video-transcript-lambda:latest <account>.dkr.ecr.<region>.amazonaws.com/video-transcript-lambda:latest

# Push to ECR
docker push <account>.dkr.ecr.<region>.amazonaws.com/video-transcript-lambda:latest

# Create Lambda function
aws lambda create-function \
  --function-name video-transcript-api \
  --package-type Image \
  --code ImageUri=<account>.dkr.ecr.<region>.amazonaws.com/video-transcript-lambda:latest \
  --role arn:aws:iam::<account>:role/lambda-execution-role
```

## Required Environment Variables

Configure these in AWS Lambda:

### Database Configuration
- `DATABASE_URL` - AWS RDS PostgreSQL connection string
- `AWS_RDS_USERNAME` - Database username
- `AWS_RDS_PASSWORD` - Database password
- `AWS_RDS_DATABASE_NAME` - Database name

### AWS Services
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `AWS_COGNITO_CLIENT_ID` - Cognito App Client ID
- `SQS_QUEUE_URL` - SQS queue for transcription processing

### Payment Providers
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret

### Email Configuration
- `FROM_EMAIL` - SES verified sender email
- `AWS_SES_SMTP_USERNAME` - SES SMTP username
- `AWS_SES_SMTP_PASSWORD` - SES SMTP password

## API Gateway Configuration

### 1. Create API Gateway

```bash
aws apigatewayv2 create-api \
  --name video-transcript-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:<region>:<account>:function:video-transcript-api
```

### 2. Configure Routes

The Lambda function handles all HTTP methods and paths:
- `GET /health` - Health check
- `POST /api/users/{userId}/transcriptions` - Create transcription
- `GET /api/users/{userId}/transcriptions` - List transcriptions
- `GET /api/users/{userId}/notifications` - Get notifications

### 3. Enable CORS

Configure CORS for frontend integration:

```json
{
  "AllowOrigins": ["https://video-transcript.jcampos.dev"],
  "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowHeaders": ["Content-Type", "Authorization", "x-api-key"]
}
```

## Lambda Function Configuration

### Memory and Timeout
- **Memory**: 1024 MB (recommended for database operations)
- **Timeout**: 30 seconds (API Gateway maximum)
- **Concurrent Executions**: 100 (adjust based on usage)

### IAM Permissions

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds-db:connect"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminCreateUser"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage"
      ],
      "Resource": "arn:aws:sqs:*:*:transcription-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

## Monitoring and Logging

### CloudWatch Logs
- Function logs available in `/aws/lambda/video-transcript-api`
- Configure log retention (7-30 days recommended)

### CloudWatch Metrics
- Monitor function duration, errors, and throttles
- Set up alarms for error rates and response times

### X-Ray Tracing
Enable X-Ray for distributed tracing:

```bash
aws lambda put-function-configuration \
  --function-name video-transcript-api \
  --tracing-config Mode=Active
```

## Performance Optimization

### Cold Start Reduction
1. **Provisioned Concurrency**: Keep functions warm
2. **Layer Optimization**: Use Lambda layers for dependencies
3. **Bundle Size**: Minimize container image size

### Database Connections
- Use connection pooling in the Express app
- Configure proper connection limits
- Implement connection retry logic

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Increase Lambda timeout
   - Check VPC configuration
   - Verify security group rules

2. **Memory Errors**
   - Increase function memory
   - Optimize application memory usage
   - Monitor CloudWatch metrics

3. **Cold Start Performance**
   - Enable provisioned concurrency
   - Optimize container size
   - Use proper Lambda runtime

### Debugging

```bash
# Check function logs
aws logs tail /aws/lambda/video-transcript-api --follow

# Test function directly
aws lambda invoke \
  --function-name video-transcript-api \
  --payload '{"httpMethod": "GET", "path": "/health"}' \
  response.json
```

## Cost Optimization

- **Request-based pricing**: Pay only for actual usage
- **Auto-scaling**: Automatic capacity management
- **No idle costs**: No charges when not processing requests
- **Provisioned concurrency**: Only when needed for performance

The Lambda deployment provides a cost-effective, scalable solution for the video transcription API with automatic scaling and zero maintenance overhead.