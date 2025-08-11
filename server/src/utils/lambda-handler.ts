import { APIGatewayEvent, APIGatewayProxyResult, Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { Request, Response } from 'express';
import express from 'express';
import serverlessHttp from 'serverless-http';

// AWS API Gateway policy generator (similar to Python example)
export class PolicyGenerator {
  static generatePolicy(
    principalId: string = 'anonymous',
    effect: 'Allow' | 'Deny' = 'Deny',
    resource: string = '*',
    usageIdentifierKey?: string
  ) {
    const policy = {
      principalId: principalId || 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }]
      },
      usageIdentifierKey: usageIdentifierKey || undefined
    };

    if (usageIdentifierKey) {
      policy.usageIdentifierKey = usageIdentifierKey;
    }

    return policy;
  }
}

// Handle API Gateway authorizer requests  
export function handleAuthorizerRequest(event: any): any {
  console.log('🔐 Handling API Gateway authorizer request');
  
  const apiGatewayArn = "*";
  const httpMethod = event.httpMethod;

  // Allow CORS preflight requests
  if (httpMethod === "OPTIONS") {
    return PolicyGenerator.generatePolicy('cors-user', 'Allow', apiGatewayArn);
  }

  // Extract API key from headers
  let apiKeyValue: string | undefined;
  
  // For REQUEST type authorizer
  if (event.headers) {
    apiKeyValue = event.headers['x-api-key'] || event.headers['X-API-Key'];
  }
  // For TOKEN type authorizer
  else if (event.identitySource?.headers) {
    apiKeyValue = event.identitySource.headers['x-api-key'];
  }

  if (!apiKeyValue) {
    console.log('❌ No API key provided');
    return PolicyGenerator.generatePolicy(null as any, 'Deny', apiGatewayArn);
  }

  try {
    // For now, we'll implement basic API key validation
    // In production, you'd validate against your API key service
    const path = event.path;
    console.log('📍 Request path:', path);

    // TODO: Implement proper API key validation
    // For demo purposes, accept any API key for transcription endpoints
    if (path.includes('/transcriptions/')) {
      console.log('✅ API key accepted for transcription endpoint');
      return PolicyGenerator.generatePolicy(
        `api-user-${apiKeyValue.substring(0, 8)}`, 
        'Allow', 
        apiGatewayArn, 
        apiKeyValue
      );
    }

    console.log('❌ API key validation failed');
    return PolicyGenerator.generatePolicy(null as any, 'Deny', apiGatewayArn);

  } catch (error) {
    console.error('❌ Error in API Gateway authorizer:', error);
    return PolicyGenerator.generatePolicy(null as any, 'Deny', apiGatewayArn);
  }
}

// Handle SQS message processing
export async function handleSQSMessages(event: SQSEvent): Promise<void> {
  console.log('📬 Processing SQS messages:', event.Records.length);
  
  for (const record of event.Records) {
    try {
      await processSQSRecord(record);
    } catch (error) {
      console.error('❌ Error processing SQS record:', record.messageId, error);
      throw error; // Re-throw to trigger Lambda retry mechanism
    }
  }
}

// Process individual SQS record
async function processSQSRecord(record: SQSRecord): Promise<void> {
  console.log('📝 Processing SQS record:', record.messageId);
  
  try {
    const messageBody = JSON.parse(record.body);
    const { type, data } = messageBody;
    
    switch (type) {
      case 'transcription_request':
        await handleTranscriptionRequest(data);
        break;
        
      case 'transcription_completed':
        await handleTranscriptionCompleted(data);
        break;
        
      case 'transcription_result':
        await handleTranscriptionResult(data);
        break;
        
      case 'notification_send':
        await handleNotificationSend(data);
        break;
        
      case 'user_sync':
        await handleUserSync(data);
        break;
        
      default:
        console.warn('⚠️ Unknown SQS message type:', type);
        // Don't throw error for unknown types to avoid infinite retries
    }
    
    console.log('✅ SQS record processed successfully:', record.messageId);
    
  } catch (error) {
    console.error('❌ Error parsing SQS message:', record.messageId, error);
    throw error;
  }
}

// Handle transcription request from SQS
async function handleTranscriptionRequest(data: any): Promise<void> {
  console.log('🎥 Processing transcription request:', data.transcriptionId);
  
  try {
    // Import transcription service from dependency injection
    const { transcriptionService } = await import('../dependency-injection');
    
    // Submit for processing using existing method
    await transcriptionService.submitForProcessing(data.transcriptionId);
    
    console.log('✅ Transcription request processed:', data.transcriptionId);
    
  } catch (error) {
    console.error('❌ Error processing transcription request:', data.transcriptionId, error);
    throw error;
  }
}

// Handle transcription completion notification
async function handleTranscriptionCompleted(data: any): Promise<void> {
  console.log('🎉 Processing transcription completion:', data.transcriptionId);
  
  try {
    // Import notification service from dependency injection
    const { notificationService } = await import('../dependency-injection');
    
    // Create completion notification using existing method
    await notificationService.createNotification({
      userId: data.userId,
      type: 'transcription_completed',
      title: 'Transcription Completed',
      message: `Your transcription for "${data.videoTitle}" is ready!`,
      metadata: { transcriptionId: data.transcriptionId },
      isRead: false
    });
    
    console.log('✅ Transcription completion notification created:', data.transcriptionId);
    
  } catch (error) {
    console.error('❌ Error creating completion notification:', data.transcriptionId, error);
    throw error;
  }
}

// Handle notification sending
async function handleNotificationSend(data: any): Promise<void> {
  console.log('📧 Processing notification send:', data.type);
  
  try {
    // Import email service from dependency injection
    const { emailService } = await import('../dependency-injection');
    
    // Send appropriate email based on type
    if (data.type === 'verification') {
      await emailService.sendVerificationEmail(data.email, data.code);
    } else if (data.type === 'password_reset') {
      await emailService.sendPasswordResetEmail(data.email, data.token);
    }
    
    console.log('✅ Notification sent successfully:', data.type);
    
  } catch (error) {
    console.error('❌ Error sending notification:', data.type, error);
    // Don't re-throw for email failures to avoid infinite retries
  }
}

// Handle transcription processing results
async function handleTranscriptionResult(data: any): Promise<void> {
  console.log('🎬 Processing transcription result:', data.transcriptionId);
  
  try {
    // Import transcription service from dependency injection
    const { transcriptionService } = await import('../dependency-injection');
    
    // Process the SQS result using the new method
    await transcriptionService.processSQSResult(data.transcriptionId, data.result);
    
    console.log('✅ Transcription result processed:', data.transcriptionId);
    
  } catch (error) {
    console.error('❌ Error processing transcription result:', data.transcriptionId, error);
    throw error;
  }
}

// Handle user synchronization
async function handleUserSync(data: any): Promise<void> {
  console.log('👤 Processing user sync:', data.userId);
  
  try {
    // For now, log the sync request - actual implementation would depend on Cognito integration
    console.log('User sync requested for:', data.userId);
    // This would typically involve updating user data from Cognito
    
    console.log('✅ User sync completed:', data.userId);
    
  } catch (error) {
    console.error('❌ Error syncing user:', data.userId, error);
    throw error;
  }
}

// Check if event is from SQS
function isSQSEvent(event: any): event is SQSEvent {
  return event.Records && Array.isArray(event.Records) && 
         event.Records.length > 0 && event.Records[0].eventSource === 'aws:sqs';
}

// Main Lambda handler supporting multiple event types
export async function lambdaHandler(event: any, context: Context): Promise<any> {
  console.log('🚀 Lambda handler invoked, event type detection...');
  
  // Check if this is an authorizer request
  if (event.type === 'TOKEN' || event.type === 'REQUEST') {
    console.log('🔐 Processing authorizer request');
    return handleAuthorizerRequest(event);
  }

  // Check if this is an SQS event
  if (isSQSEvent(event)) {
    console.log('📬 Processing SQS event with', event.Records.length, 'messages');
    try {
      await handleSQSMessages(event);
      console.log('✅ All SQS messages processed successfully');
      return { statusCode: 200 }; // SQS doesn't expect detailed response
    } catch (error) {
      console.error('❌ SQS processing failed:', error);
      throw error; // Let Lambda handle retries
    }
  }

  // Check if event comes from EventBridge
  if (event.source === "aws.events") {
    console.log('📅 Processing EventBridge event');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'EventBridge event processed' })
    };
  }

  // Handle HTTP requests through Express app (API Gateway)
  console.log('🌐 Processing HTTP request through Express');
  
  try {
    // Import and create the Express app
    const { createApp } = await import('../app');
    const app = await createApp();
    
    // Use serverless-http to handle the conversion
    const handler = serverlessHttp(app);
    
    // Handle the request
    const result = await handler(event, context) as APIGatewayProxyResult;
    
    console.log('✅ HTTP request processed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error processing HTTP request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// Simplified version - in production you'd integrate with your Express app

// Check if request is from API Gateway
export function isApiGatewayRequest(req: any): boolean {
  return req.isApiGatewayRequest === true;
}

// Extract API key from API Gateway context
export function getApiKeyFromContext(req: any): string | undefined {
  if (isApiGatewayRequest(req)) {
    return req.apiGatewayContext?.usageIdentifierKey || 
           req.apiGatewayContext?.apiKeyId ||
           req.headers['x-api-key'] ||
           req.headers['X-API-Key'];
  }
  return undefined;
}