import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { APP_CONFIG } from './app';

// Swagger JSDoc configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Video Transcript API',
      version: '1.0.0',
      description: 'AI-powered video transcription service with freemium model, user authentication, and payment integration',
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authenticated requests'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for AWS Lambda/API Gateway integration'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Transcription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            videoUrl: { type: 'string', format: 'url' },
            videoTitle: { type: 'string', nullable: true },
            transcript: { type: 'string', nullable: true },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'completed', 'failed'] 
            },
            duration: { type: 'number', nullable: true },
            wordCount: { type: 'number', nullable: true },
            processingTime: { type: 'number', nullable: true },
            accuracy: { type: 'number', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object', nullable: true }
          }
        }
      }
    },
    tags: [

      {
        name: 'Users',
        description: 'User profile and account management'
      },
      {
        name: 'Transcriptions',
        description: 'Video transcription processing and management with domain-style URLs'
      },
      {
        name: 'Payments',
        description: 'Payment processing with Stripe and PayPal'
      },
      {
        name: 'Health',
        description: 'System health monitoring and status checks'
      },
      {
        name: 'Notifications',
        description: 'User notification system with real-time updates'
      }
    ]
  },
  apis: [
    './server/src/controllers/*.modern.ts',
    './server/src/controllers/notification.controller.ts',
    './server/src/routes/*.swagger.ts'
  ]
};

export class SwaggerAutoConfig {
  private swaggerSpec: any;

  constructor() {
    this.swaggerSpec = swaggerJSDoc(swaggerOptions);
  }

  public setupSwaggerEndpoints(app: Express): void {
    // Serve OpenAPI JSON spec
    app.get('/api/docs/openapi.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(this.swaggerSpec);
    });

    // Serve Swagger UI
    app.use('/docs', swaggerUi.serve);
    app.get('/docs', swaggerUi.setup(this.swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Video Transcript API Documentation'
    }));

    console.log('📋 API Documentation: http://localhost:5000/docs');
    console.log('📋 OpenAPI Spec: http://localhost:5000/api/docs/openapi.json');
  }

  public getSpec(): any {
    return this.swaggerSpec;
  }
}