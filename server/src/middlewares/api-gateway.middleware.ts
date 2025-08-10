import { Request, Response, NextFunction } from 'express';
import { isApiGatewayRequest, getApiKeyFromContext } from '../utils/lambda-handler';

export interface ApiGatewayRequest extends Request {
  isApiGatewayRequest?: boolean;
  apiKeyId?: string;
  usageIdentifierKey?: string;
  apiGatewayContext?: any;
}

// Middleware to detect and handle API Gateway requests
export function apiGatewayMiddleware(req: ApiGatewayRequest, res: Response, next: NextFunction) {
  // Check if this is an API Gateway request
  if (isApiGatewayRequest(req)) {
    console.log('🔗 API Gateway request detected');
    
    // Extract API key information
    const apiKey = getApiKeyFromContext(req);
    if (apiKey) {
      req.apiKeyId = apiKey;
      req.usageIdentifierKey = apiKey;
      console.log(`🔑 API Key extracted: ${apiKey.substring(0, 8)}...`);
    }

    // Mark request as API Gateway
    req.isApiGatewayRequest = true;
    
    // Set CORS headers for API Gateway
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, X-API-Key, Authorization');
  }

  next();
}

// Middleware specifically for API Gateway authentication (bypasses normal auth)
export function apiGatewayAuthBypass(req: ApiGatewayRequest, res: Response, next: NextFunction) {
  // If this is an API Gateway request with a valid API key, bypass normal authentication
  if (req.isApiGatewayRequest && req.apiKeyId) {
    console.log('🔓 API Gateway authentication bypass activated');
    
    // Create a pseudo-user for API Gateway requests
    (req as any).userId = null; // Anonymous for API Gateway requests
    (req as any).user = {
      id: null,
      username: `api-user-${req.apiKeyId.substring(0, 8)}`,
      email: null,
      isApiGatewayUser: true
    };
    
    return next();
  }

  // For normal requests, continue with regular auth flow
  next();
}