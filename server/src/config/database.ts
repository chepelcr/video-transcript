import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/auth-schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL || process.env.AWS_RDS_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or AWS_RDS_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

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