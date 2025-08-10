import { Express } from 'express';
import { APP_CONFIG } from './app';

export interface ApiEndpoint {
  method: string;
  path: string;
  name: string;
  description: string;
  tags: string[];
  parameters?: {
    name: string;
    in: 'path' | 'query' | 'body';
    required: boolean;
    description: string;
    type: string;
    example?: any;
  }[];
  responses: {
    [code: string]: {
      description: string;
      example?: any;
    };
  };
  middleware?: string[];
}

export interface ApiTag {
  name: string;
  description: string;
}

export class SwaggerConfig {
  private endpoints: ApiEndpoint[] = [];
  private tags: ApiTag[] = [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User profile and account management'
    },
    {
      name: 'Transcriptions',
      description: 'Video transcription processing and management'
    },
    {
      name: 'Payments',
      description: 'Payment processing with Stripe and PayPal'
    },
    {
      name: 'Health',
      description: 'System health monitoring and status checks'
    }
  ];

  constructor() {
    this.registerEndpoints();
  }

  private registerEndpoints(): void {
    // Authentication endpoints
    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/register',
      name: 'Register User',
      description: 'Register a new user account with email verification',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'username',
          in: 'body',
          required: true,
          description: 'Unique username for the account',
          type: 'string',
          example: 'johndoe'
        },
        {
          name: 'email',
          in: 'body',
          required: true,
          description: 'Valid email address',
          type: 'string',
          example: 'john@example.com'
        },
        {
          name: 'password',
          in: 'body',
          required: true,
          description: 'Strong password (min 8 characters)',
          type: 'string',
          example: 'SecurePass123!'
        }
      ],
      responses: {
        '201': {
          description: 'User registered successfully',
          example: {
            user: {
              id: 'uuid-here',
              username: 'johndoe',
              email: 'john@example.com',
              emailVerified: false
            },
            accessToken: 'jwt-token-here',
            refreshToken: 'refresh-token-here'
          }
        },
        '400': {
          description: 'Registration failed',
          example: {
            error: 'User already exists with this email'
          }
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/login',
      name: 'Login User',
      description: 'Authenticate user with email and password',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'email',
          in: 'body',
          required: true,
          description: 'User email address',
          type: 'string',
          example: 'john@example.com'
        },
        {
          name: 'password',
          in: 'body',
          required: true,
          description: 'User password',
          type: 'string',
          example: 'SecurePass123!'
        }
      ],
      responses: {
        '200': {
          description: 'Login successful',
          example: {
            user: { id: 'uuid', username: 'johndoe', email: 'john@example.com' },
            accessToken: 'jwt-token',
            refreshToken: 'refresh-token'
          }
        },
        '401': {
          description: 'Invalid credentials'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/verify-email',
      name: 'Verify Email',
      description: 'Verify user email with verification code',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'email',
          in: 'body',
          required: true,
          description: 'User email address',
          type: 'string',
          example: 'john@example.com'
        },
        {
          name: 'code',
          in: 'body',
          required: true,
          description: '6-digit verification code',
          type: 'string',
          example: 'ABC123'
        }
      ],
      responses: {
        '200': {
          description: 'Email verified successfully'
        },
        '400': {
          description: 'Invalid or expired verification code'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/forgot-password',
      name: 'Forgot Password',
      description: 'Request password reset email',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'email',
          in: 'body',
          required: true,
          description: 'User email address',
          type: 'string',
          example: 'john@example.com'
        }
      ],
      responses: {
        '200': {
          description: 'Password reset email sent (if account exists)'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/reset-password',
      name: 'Reset Password',
      description: 'Reset password using reset token',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'token',
          in: 'body',
          required: true,
          description: 'Password reset token from email',
          type: 'string'
        },
        {
          name: 'newPassword',
          in: 'body',
          required: true,
          description: 'New password',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Password reset successfully'
        },
        '400': {
          description: 'Invalid or expired reset token'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/auth/refresh-token',
      name: 'Refresh Access Token',
      description: 'Get new access token using refresh token',
      tags: ['Authentication'],
      parameters: [
        {
          name: 'refreshToken',
          in: 'body',
          required: true,
          description: 'Valid refresh token',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'New access token generated',
          example: { accessToken: 'new-jwt-token' }
        },
        '401': {
          description: 'Invalid refresh token'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/api/auth/me',
      name: 'Get Current User',
      description: 'Get authenticated user information',
      tags: ['Authentication'],
      middleware: ['auth'],
      responses: {
        '200': {
          description: 'User information retrieved',
          example: {
            id: 'uuid',
            username: 'johndoe',
            email: 'john@example.com',
            emailVerified: true
          }
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });

    // User endpoints
    this.registerEndpoint({
      method: 'GET',
      path: '/api/users/profile',
      name: 'Get User Profile',
      description: 'Get detailed user profile information',
      tags: ['Users'],
      middleware: ['auth'],
      responses: {
        '200': {
          description: 'User profile retrieved'
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });

    this.registerEndpoint({
      method: 'PUT',
      path: '/api/users/profile',
      name: 'Update User Profile',
      description: 'Update user profile information (username only)',
      tags: ['Users'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'username',
          in: 'body',
          required: false,
          description: 'New username',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Profile updated successfully'
        },
        '400': {
          description: 'Username already taken'
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });



    // Domain-style Transcription endpoints
    this.registerEndpoint({
      method: 'POST',
      path: '/users/{userId}/transcriptions',
      name: 'Create User Transcription',
      description: 'Submit video URL for transcription processing for specific user',
      tags: ['Transcriptions'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'User UUID (must match authenticated user)',
          type: 'string'
        },
        {
          name: 'videoUrl',
          in: 'body',
          required: true,
          description: 'Video URL (YouTube, Vimeo, or direct link)',
          type: 'string',
          example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ],
      responses: {
        '201': {
          description: 'Transcription request created'
        },
        '400': {
          description: 'Invalid video URL or daily limit exceeded'
        },
        '401': {
          description: 'Not authenticated'
        },
        '403': {
          description: 'User can only access their own transcriptions'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/users/{userId}/transcriptions',
      name: 'Get User Transcriptions',
      description: 'Get all transcriptions for specific user',
      tags: ['Transcriptions'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'User UUID (must match authenticated user)',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Transcriptions retrieved successfully'
        },
        '401': {
          description: 'Not authenticated'
        },
        '403': {
          description: 'User can only access their own transcriptions'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/users/{userId}/transcriptions/{id}',
      name: 'Get User Transcription By ID',
      description: 'Get specific transcription by ID for specific user',
      tags: ['Transcriptions'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'User UUID (must match authenticated user)',
          type: 'string'
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transcription UUID',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Transcription retrieved successfully'
        },
        '401': {
          description: 'Not authenticated'
        },
        '403': {
          description: 'User can only access their own transcriptions'
        },
        '404': {
          description: 'Transcription not found'
        }
      }
    });

    this.registerEndpoint({
      method: 'PATCH',
      path: '/users/{userId}/transcriptions/{id}',
      name: 'Update User Transcription',
      description: 'Update specific transcription for specific user',
      tags: ['Transcriptions'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'User UUID (must match authenticated user)',
          type: 'string'
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transcription UUID',
          type: 'string'
        },
        {
          name: 'transcript',
          in: 'body',
          required: false,
          description: 'Updated transcript text',
          type: 'string'
        },
        {
          name: 'status',
          in: 'body',
          required: false,
          description: 'Updated transcription status',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Transcription updated successfully'
        },
        '401': {
          description: 'Not authenticated'
        },
        '403': {
          description: 'User can only access their own transcriptions'
        },
        '404': {
          description: 'Transcription not found'
        }
      }
    });

    // Public access endpoints
    this.registerEndpoint({
      method: 'GET',
      path: '/transcriptions/{id}/public',
      name: 'Get Public Transcription',
      description: 'Get transcription for public viewing (no authentication required)',
      tags: ['Transcriptions'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transcription UUID',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Public transcription retrieved successfully'
        },
        '404': {
          description: 'Transcription not found or not public'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/transcriptions/webhook/{id}',
      name: 'Transcription Webhook',
      description: 'Webhook endpoint for transcription processing updates',
      tags: ['Transcriptions'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Transcription UUID',
          type: 'string'
        },
        {
          name: 'status',
          in: 'body',
          required: true,
          description: 'Updated transcription status',
          type: 'string'
        },
        {
          name: 'transcript',
          in: 'body',
          required: false,
          description: 'Transcription text (if completed)',
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Webhook processed successfully'
        },
        '400': {
          description: 'Invalid webhook payload'
        },
        '404': {
          description: 'Transcription not found'
        }
      }
    });

    // Payment endpoints
    this.registerEndpoint({
      method: 'POST',
      path: '/api/payments/stripe/create-subscription',
      name: 'Create Stripe Subscription',
      description: 'Create Stripe subscription for premium features',
      tags: ['Payments'],
      middleware: ['auth'],
      responses: {
        '200': {
          description: 'Subscription created successfully'
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/api/payments/stripe/subscription-status',
      name: 'Get Subscription Status',
      description: 'Get current Stripe subscription status',
      tags: ['Payments'],
      middleware: ['auth'],
      responses: {
        '200': {
          description: 'Subscription status retrieved'
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });

    this.registerEndpoint({
      method: 'POST',
      path: '/api/payments/paypal/create-order',
      name: 'Create PayPal Order',
      description: 'Create PayPal payment order',
      tags: ['Payments'],
      middleware: ['auth'],
      parameters: [
        {
          name: 'amount',
          in: 'body',
          required: true,
          description: 'Payment amount',
          type: 'number',
          example: 9.99
        },
        {
          name: 'currency',
          in: 'body',
          required: true,
          description: 'Currency code',
          type: 'string',
          example: 'USD'
        }
      ],
      responses: {
        '200': {
          description: 'PayPal order created'
        },
        '401': {
          description: 'Not authenticated'
        }
      }
    });

    // Health endpoints
    this.registerEndpoint({
      method: 'GET',
      path: '/health',
      name: 'Health Check',
      description: 'Comprehensive system health check with service status',
      tags: ['Health'],
      responses: {
        '200': {
          description: 'System is healthy',
          example: {
            status: 'healthy',
            timestamp: '2024-01-01T00:00:00.000Z',
            uptime: 3600,
            services: {
              database: { status: 'healthy' },
              email: { status: 'healthy' }
            }
          }
        },
        '503': {
          description: 'System is unhealthy'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/readiness',
      name: 'Readiness Probe',
      description: 'Kubernetes-style readiness probe for load balancers',
      tags: ['Health'],
      responses: {
        '200': {
          description: 'Service is ready'
        },
        '503': {
          description: 'Service is not ready'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/liveness',
      name: 'Liveness Probe',
      description: 'Kubernetes-style liveness probe for health monitoring',
      tags: ['Health'],
      responses: {
        '200': {
          description: 'Service is alive'
        },
        '503': {
          description: 'Service is dead'
        }
      }
    });

    this.registerEndpoint({
      method: 'GET',
      path: '/ping',
      name: 'Ping',
      description: 'Simple availability check',
      tags: ['Health'],
      responses: {
        '200': {
          description: 'Pong response',
          example: { status: 'pong', timestamp: '2024-01-01T00:00:00.000Z' }
        }
      }
    });
  }

  private registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  public getOpenApiSpec() {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Video Transcript API',
        description: 'AI-powered video transcription service with freemium model, user authentication, and payment integration',
        version: '1.0.0',
        contact: {
          name: 'Video Transcript Support',
          url: 'https://video-transcript.jcampos.dev'
        }
      },
      servers: [
        {
          url: APP_CONFIG.NODE_ENV === 'production' 
            ? 'https://api-video-transcript.jcampos.dev' 
            : process.env.REPLIT_DOMAINS 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : 'http://localhost:5000',
          description: APP_CONFIG.NODE_ENV === 'production' ? 'Production API' : 'Development API'
        }
      ],
      tags: this.tags,
      paths: this.generatePaths(),
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }

  private generatePaths() {
    const paths: any = {};

    this.endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const operation: any = {
        tags: endpoint.tags,
        summary: endpoint.name,
        description: endpoint.description,
        responses: {}
      };

      // Add security for protected endpoints
      if (endpoint.middleware?.includes('auth')) {
        operation.security = [{ BearerAuth: [] }];
      }

      // Add parameters
      if (endpoint.parameters) {
        operation.parameters = endpoint.parameters.map(param => ({
          name: param.name,
          in: param.in === 'body' ? 'requestBody' : param.in,
          required: param.required,
          description: param.description,
          schema: {
            type: param.type,
            example: param.example
          }
        }));

        // Handle request body separately for OpenAPI 3.0
        const bodyParams = endpoint.parameters.filter(p => p.in === 'body');
        if (bodyParams.length > 0) {
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: bodyParams.reduce((props, param) => {
                    props[param.name] = {
                      type: param.type,
                      description: param.description,
                      example: param.example
                    };
                    return props;
                  }, {} as any),
                  required: bodyParams.filter(p => p.required).map(p => p.name)
                }
              }
            }
          };
          // Remove body params from parameters
          operation.parameters = operation.parameters.filter((p: any) => p.in !== 'requestBody');
        }
      }

      // Add responses
      Object.entries(endpoint.responses).forEach(([code, response]) => {
        operation.responses[code] = {
          description: response.description,
          ...(response.example && {
            content: {
              'application/json': {
                example: response.example
              }
            }
          })
        };
      });

      paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
    });

    return paths;
  }

  public setupSwaggerEndpoints(app: Express): void {
    // OpenAPI JSON endpoint - use /api path to avoid Vite interference
    app.get('/api/docs/openapi.json', (req, res) => {
      res.set('Content-Type', 'application/json');
      res.json(this.getOpenApiSpec());
    });

    // Swagger UI HTML endpoint - use /api path to avoid Vite interference
    app.get('/api/docs', (req, res) => {
      const swaggerHtml = this.generateSwaggerHtml();
      res.set('Content-Type', 'text/html');
      res.send(swaggerHtml);
    });
    
    // Legacy endpoints for backward compatibility (these may be intercepted by Vite)
    app.get('/api-docs', (req, res) => {
      res.set('Content-Type', 'application/json');
      res.json(this.getOpenApiSpec());
    });

    app.get('/docs', (req, res) => {
      const swaggerHtml = this.generateSwaggerHtml();
      res.set('Content-Type', 'text/html');
      res.send(swaggerHtml);
    });
  }

  private generateSwaggerHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Transcript API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #1976d2;
        }
        .swagger-ui .topbar .download-url-wrapper .download-url-button {
            background-color: #1565c0;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                operationsSorter: "method",
                tagsSorter: "alpha",
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            });
        };
    </script>
</body>
</html>`;
  }
}