import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use AWS RDS connection if available, fallback to DATABASE_URL
const databaseUrl = process.env.AWS_RDS_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "AWS_RDS_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');

// Configure connection pool for AWS RDS PostgreSQL
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Increase timeout for AWS RDS
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const db = drizzle(pool, { schema });
