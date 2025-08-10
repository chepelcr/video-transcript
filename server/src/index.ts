/**
 * Server Entry Point - Industry Standard Architecture
 * 
 * This is the new modernized server entry point following enterprise-level
 * patterns with proper layered architecture, dependency injection, and
 * separation of concerns.
 */

import { startServer } from './server';

// Start the server
startServer().catch((error) => {
  console.error('❌ Fatal server error:', error);
  process.exit(1);
});