import express, { Express } from 'express';
import { connectDatabase } from './config/database';
import { APP_CONFIG } from './config/app';
import { authRoutes, transcriptionRoutes, paymentRoutes } from './dependency-injection';

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

  // Connect to database
  await connectDatabase();

  // New API routes (industry standard architecture)
  app.use('/api/auth', authRoutes.getRouter());
  app.use('/api/transcriptions', transcriptionRoutes.getRouter());
  app.use('/api/payments', paymentRoutes.getRouter());

  // TODO: Migrate old routes to new architecture

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

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