import express, { Express } from 'express';
import { connectDatabase } from './config/database';
import { APP_CONFIG } from './config/app';
import { SwaggerAutoConfig } from './config/swagger-auto';
import { 
  modernTranscriptionController, modernAuthController, modernUserController, 
  modernPaymentController, modernHealthController, notificationController 
} from './dependency-injection';

export async function createApp(): Promise<Express> {
  const app: Express = express();

  // CORS Configuration
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    console.log(`CORS check: origin=${origin}, allowed=${!origin || APP_CONFIG.ALLOWED_ORIGINS.some(allowed => origin?.includes(allowed))}`);
    
    if (!origin || APP_CONFIG.ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Signature');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${timestamp} [express] ${req.method} ${req.path}`);
    next();
  });

  // Connect to database (optional - fallback if not available)
  try {
    await connectDatabase();
    console.log('✅ Database connection successful');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('⚠️ Database connection failed, continuing without database:', errorMessage);
    // Continue without database for demo purposes
  }

  // API Documentation endpoints (must be before frontend fallback)
  const swaggerAutoConfig = new SwaggerAutoConfig();
  swaggerAutoConfig.setupSwaggerEndpoints(app);

  // Modern controller-based architecture (AWS API Gateway compatible, no JWT validation)
  app.use('/', modernHealthController.getRouter());
  app.use('/api', modernTranscriptionController.getRouter());
  app.use('/api/auth', modernAuthController.getRouter());
  app.use('/api/users', modernUserController.getRouter());
  app.use('/api/payments', modernPaymentController.getRouter());
  app.use('/api', notificationController.getRouter());

  // Remove duplicate health endpoint (handled by healthRoutes)

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  return app;
}