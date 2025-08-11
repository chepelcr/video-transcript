# AWS Secrets Manager Setup Guide

This guide explains how to set up AWS Secrets Manager for the video transcription service.

## Overview

The application now uses AWS Secrets Manager to securely store sensitive credentials instead of environment variables. This provides better security, automatic rotation capabilities, and centralized secret management.

## Required Secrets

### 1. Database Credentials Secret

**Secret Name**: `dev/video-transcript/db`

**Format**:
```json
{
  "username": "dbmasteruser",
  "password": "your_database_password",
  "engine": "postgres", 
  "host": "your-rds-endpoint.co1kq0qg0vtn.us-east-1.rds.amazonaws.com",
  "port": "5432",
  "dbname": "video-transcript"
}
```

**Setup Steps**:
1. Go to AWS Secrets Manager console
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Enter the JSON above with your actual values
5. Name the secret: `dev/video-transcript/db`
6. Complete the creation process

### 2. SMTP Credentials Secret

**Secret Name**: `dev/FrontEnd/ses`

**Format**:
```json
{
  "host": "email-smtp.us-east-1.amazonaws.com",
  "port": "587",
  "user": "your_ses_smtp_username", 
  "password": "your_ses_smtp_password"
}
```

**Setup Steps**:
1. Go to AWS Secrets Manager console
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Enter the JSON above with your SES SMTP credentials
5. Name the secret: `dev/FrontEnd/ses`
6. Complete the creation process

## IAM Permissions

Your application needs these IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:dev/video-transcript/db-*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:dev/FrontEnd/ses-*"
      ]
    }
  ]
}
```

Replace `ACCOUNT` with your AWS account ID.

## How It Works

### Database Connection
- The application automatically retrieves database credentials from `dev/video-transcript/db`
- Falls back to environment variables if secret retrieval fails
- Credentials are cached for performance

### Email Service
- SMTP credentials are retrieved from `dev/FrontEnd/ses`
- Falls back to environment variables for backward compatibility
- Supports automatic failover

### Error Handling
- Graceful fallback to environment variables
- Detailed logging for troubleshooting
- No application crashes if secrets are unavailable

## Migration from Environment Variables

If you're migrating from environment variables:

1. **Create the secrets** in AWS Secrets Manager using the formats above
2. **Verify IAM permissions** for your application
3. **Test the application** - it should automatically use secrets
4. **Remove old environment variables** once confirmed working:
   - `AWS_RDS_DATABASE_URL`
   - `AWS_RDS_DATABASE_NAME` 
   - `AWS_RDS_USERNAME`
   - `AWS_RDS_PASSWORD`
   - `AWS_SES_SMTP_USERNAME`
   - `AWS_SES_SMTP_PASSWORD`

## Benefits

✅ **Enhanced Security**: Credentials are encrypted at rest and in transit
✅ **Centralized Management**: All secrets in one place
✅ **Automatic Rotation**: Support for automatic credential rotation
✅ **Audit Trail**: Full logging of secret access
✅ **IAM Integration**: Fine-grained access control
✅ **Fallback Support**: Graceful degradation to environment variables

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Check IAM permissions
   - Verify secret names match exactly
   - Ensure AWS credentials are configured

2. **Secret not found**
   - Verify secret exists in correct region
   - Check secret name spelling
   - Confirm AWS region configuration

3. **Application still using environment variables**
   - Check logs for secret retrieval messages
   - Verify AWS credentials are working
   - Test secret access manually

### Debug Commands

```bash
# Test secret access
aws secretsmanager get-secret-value --secret-id dev/video-transcript/db

# Check IAM permissions
aws sts get-caller-identity

# View application logs
# Look for "AWS Secrets Manager" messages
```

## Production Considerations

- Use different secret names for production (e.g., `prod/video-transcript/db`)
- Enable automatic rotation for database passwords
- Monitor secret access through CloudTrail
- Set up CloudWatch alarms for failed secret retrievals
- Consider using AWS AppConfig for non-sensitive configuration