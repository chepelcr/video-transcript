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

The Lambda handler (`server/lambda.ts`) provides:
- **API Gateway Integration**: HTTP request/response handling
- **Express App Integration**: Reuses existing Express application
- **Authorizer Support**: API key validation for secured endpoints
- **EventBridge Support**: Handles scheduled events

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

# Test the endpoint
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"httpMethod": "GET", "path": "/health", "headers": {}}'
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