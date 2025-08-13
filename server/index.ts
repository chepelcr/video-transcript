/**
 * Main Server Entry Point
 * 
 * This file bridges the old Vite setup (which must be preserved) with the new
 * enterprise architecture. We need both because:
 * - New architecture: Clean, maintainable enterprise patterns
 * - Old Vite setup: Required for frontend integration (protected file)
 */

import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { createApp } from "./src/app";

const app = express();

// CORS configuration for GitHub Pages deployment
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://jcampos.dev', // Main domain
    'https://video-transcript.jcampos.dev', // Custom subdomain
    'https://a84950eb-2031-40c4-8a39-1789c99c8ca2-00-2c46rofc44noa.spock.replit.dev', // Replit frontend
    process.env.FRONTEND_URL,
    process.env.REPL_SLUG && `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.replit.app`
  ].filter(Boolean);

  const origin = req.headers.origin;
  console.log(`CORS check: origin=${origin}, allowed=${allowedOrigins.includes(origin || '')}`);
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('replit.dev')) {
    // Allow any replit.dev subdomain
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Allow all origins in development for now
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Try enterprise architecture first, fall back to legacy if database issues
    console.log('🚀 Starting hybrid server...');
    
    try {
      // Create the new enterprise app and mount it
      const enterpriseApp = await createApp();
      app.use('/', enterpriseApp);
      console.log('✅ Using enterprise architecture with full database support');
    } catch (error) {
      console.error('❌ Failed to start enterprise architecture:', error);
      throw error;
    }
    
    // Create HTTP server
    const server = await import('http').then(http => http.createServer(app));

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup Vite (must be after all other routes)
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, "0.0.0.0", () => {
      log(`🌐 Hybrid server running on port ${port}`);
      console.log(`   📋 API Documentation: http://localhost:${port}/api/docs`);
      console.log(`   🩺 Health Check: http://localhost:${port}/health`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
})();
