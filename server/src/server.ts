import { createServer } from 'http';
import { createApp } from './app';
import { APP_CONFIG } from './config/app';

export async function startServer() {
  try {
    console.log('🚀 Starting server with industry-standard architecture...');
    console.log(`   Environment: ${APP_CONFIG.NODE_ENV}`);
    console.log(`   Port: ${APP_CONFIG.PORT}`);
    
    // Create Express app
    const app = await createApp();
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Start server
    httpServer.listen(APP_CONFIG.PORT, () => {
      console.log(`✅ Server running on port ${APP_CONFIG.PORT}`);
      console.log(`   Health check: http://localhost:${APP_CONFIG.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
      
      httpServer.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return httpServer;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}