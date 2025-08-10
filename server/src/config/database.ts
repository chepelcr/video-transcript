// Use regular PostgreSQL connection instead of Neon for AWS RDS
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/auth-schema";

// Construct database URL from AWS RDS secrets or use provided URL
let databaseUrl = process.env.DATABASE_URL || process.env.AWS_RDS_DATABASE_URL;

if (!databaseUrl && process.env.AWS_RDS_USERNAME && process.env.AWS_RDS_PASSWORD) {
  // Build URL from AWS RDS components - use exact same logic as working old server
  const host = process.env.PGHOST || 'ls-85945ed6753f404b7b7d74097b833502d2a152ef.co1kq0qg0vtn.us-east-1.rds.amazonaws.com';
  const port = process.env.PGPORT || '5432';
  const database = process.env.AWS_RDS_DATABASE_NAME || process.env.PGDATABASE || 'video-transcript';
  const username = process.env.AWS_RDS_USERNAME;
  const password = process.env.AWS_RDS_PASSWORD;
  
  databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  console.log('✅ Using AWS RDS connection');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   URL format: postgresql://${username}:***@${host}:${port}/${database}`);
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL, AWS_RDS_DATABASE_URL, or AWS RDS credentials must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });

export const connectDatabase = async () => {
  try {
    console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');
    // Test connection
    await pool.connect();
    console.log('Database connection configured successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};