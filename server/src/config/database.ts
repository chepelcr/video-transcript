// Use regular PostgreSQL connection instead of Neon for AWS RDS
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/auth-schema";

// Construct database URL from AWS RDS secrets or use provided URL
let databaseUrl = process.env.DATABASE_URL;

// If no complete DATABASE_URL, construct it from AWS RDS components
if (!databaseUrl && process.env.AWS_RDS_USERNAME && process.env.AWS_RDS_PASSWORD) {
  // Build URL from AWS RDS components
  // AWS_RDS_DATABASE_URL contains just the hostname, need to construct full URL
  const host = process.env.AWS_RDS_DATABASE_URL || 'ls-85945ed6753f404b7b7d74097b833502d2a152ef.co1kq0qg0vtn.us-east-1.rds.amazonaws.com';
  const port = '5432';
  const database = process.env.AWS_RDS_DATABASE_NAME || 'video-transcipt'; // Use exact name from env
  const username = process.env.AWS_RDS_USERNAME;
  const password = process.env.AWS_RDS_PASSWORD;
  
  // URL encode the password to handle special characters
  const encodedPassword = encodeURIComponent(password);
  databaseUrl = `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
  
  console.log('✅ Using AWS RDS connection');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   Username: ${username}`);
  console.log(`   Constructed URL: postgresql://${username}:***@${host}:${port}/${database}`);
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL, AWS_RDS_DATABASE_URL, or AWS RDS credentials must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // AWS RDS requires SSL but with self-signed certificates
  }
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