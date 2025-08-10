import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Request, Response } from 'express';
import express from 'express';

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
export function handleAuthorizerRequest(event: any) {
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

// Main Lambda handler (similar to Python example)
export async function lambdaHandler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('🚀 Lambda handler invoked');
  
  // Check if this is an authorizer request
  if ((event as any).type === 'TOKEN' || (event as any).type === 'REQUEST') {
    console.log('🔐 Processing authorizer request');
    return handleAuthorizerRequest(event as any);
  }

  // Check if event comes from EventBridge
  if ((event as any).source === "aws.events") {
    console.log('📅 Processing EventBridge event');
    // Handle EventBridge invocation
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'EventBridge event processed' })
    };
  }

  // Handle HTTP requests through Express app
  console.log('🌐 Processing HTTP request through Express');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Lambda handler working', 
      path: event.path,
      method: event.httpMethod 
    })
  };
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