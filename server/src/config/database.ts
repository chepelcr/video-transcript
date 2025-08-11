import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { AWSSecretsService, type DatabaseCredentials } from '../services/aws-secrets.service';

let databaseUrl: string;
let dbCredentials: DatabaseCredentials | null = null;

// Try to get credentials from AWS Secrets Manager first
async function initializeDatabaseCredentials(): Promise<string> {
  try {
    const secretsService = new AWSSecretsService();
    dbCredentials = await secretsService.getDatabaseCredentials();
    
    // Construct connection string from AWS Secrets Manager
    const username = encodeURIComponent(dbCredentials.username);
    const password = encodeURIComponent(dbCredentials.password);
    const host = dbCredentials.host;
    const port = dbCredentials.port;
    const database = dbCredentials.dbname;
    
    databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
    console.log('🔐 Using AWS Secrets Manager for database credentials');
    console.log(`   Host: ${host}`);
    console.log(`   Database: ${database}`);
    console.log(`   Username: ${username}`);
    
    return databaseUrl;
    
  } catch (error: any) {
    console.warn('⚠️ Failed to retrieve credentials from AWS Secrets Manager:', error.message);
    console.log('⚠️ Falling back to environment variables...');
    
    // Fallback to environment variables
    let fallbackUrl = process.env.DATABASE_URL;

    if (process.env.AWS_RDS_DATABASE_URL && process.env.AWS_RDS_USERNAME && process.env.AWS_RDS_PASSWORD && process.env.AWS_RDS_DATABASE_NAME) {
      // Construct proper PostgreSQL connection string
      const host = process.env.AWS_RDS_DATABASE_URL;
      const username = encodeURIComponent(process.env.AWS_RDS_USERNAME);
      const password = encodeURIComponent(process.env.AWS_RDS_PASSWORD);
      const database = process.env.AWS_RDS_DATABASE_NAME === 'video-transcipt' ? 'video-transcript' : process.env.AWS_RDS_DATABASE_NAME;
      const port = process.env.AWS_RDS_PORT || '5432';
      
      fallbackUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      console.log('✅ Using AWS RDS environment variables');
      console.log(`   Host: ${host}`);
      console.log(`   Database: ${database}`);
    } else {
      console.log('⚠️ Using fallback DATABASE_URL');
      console.log('   Missing AWS RDS credentials');
    }

    if (!fallbackUrl) {
      throw new Error(
        "AWS Secrets Manager credentials, AWS_RDS_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    
    databaseUrl = fallbackUrl;
    return databaseUrl;
  }
}

// Initialize database connection asynchronously
let pool: Pool;
let db: ReturnType<typeof drizzle>;

async function createDatabaseConnection(): Promise<{ pool: Pool; db: ReturnType<typeof drizzle> }> {
  const connectionString = await initializeDatabaseCredentials();
  
  console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');
  console.log('Database host:', connectionString.includes('amazonaws.com') ? 'AWS RDS' : 'Other');

  // Validate the connection string format
  if (!connectionString || (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://'))) {
    console.error('Invalid database URL format. Expected postgresql:// or postgres:// prefix');
    throw new Error('Invalid database URL format. Must start with postgresql:// or postgres://');
  }

  console.log('Database connection configured successfully');

  // Configure connection pool for AWS RDS PostgreSQL
  const poolConfig: any = {
    connectionString,
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Increase timeout for AWS RDS
  };

  // Handle SSL for AWS RDS
  if (connectionString.includes('amazonaws.com')) {
    poolConfig.ssl = {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined, // Skip server identity check
    };
  }

  const newPool = new Pool(poolConfig);

  // Handle pool errors
  newPool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  const newDb = drizzle(newPool, { schema });
  
  return { pool: newPool, db: newDb };
}

// Export getter functions for lazy initialization
export const getPool = async (): Promise<Pool> => {
  if (!pool) {
    const connection = await createDatabaseConnection();
    pool = connection.pool;
    db = connection.db;
  }
  return pool;
};

export const getDb = async (): Promise<ReturnType<typeof drizzle>> => {
  if (!db) {
    const connection = await createDatabaseConnection();
    pool = connection.pool;
    db = connection.db;
  }
  return db;
};

export const connectDatabase = async () => {
  try {
    console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');
    // Get pool and test connection
    const connectionPool = await getPool();
    const client = await connectionPool.connect();
    client.release(); // Release the test connection
    console.log('Database connection configured successfully');
    
    // Create notifications table if it doesn't exist
    await createNotificationsTable();
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

async function createNotificationsTable(): Promise<void> {
  try {
    console.log('📬 Creating notifications table...');
    
    const dbConnection = await getDb();
    const connectionPool = await getPool();
    const client = await connectionPool.connect();
    
    // Drop existing table and recreate with correct structure
    await client.query('DROP TABLE IF EXISTS notifications');
    
    await client.query(`
      CREATE TABLE notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id VARCHAR,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)');
    
    client.release();
    console.log('✅ Notifications table created successfully');
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    // Don't throw error - continue without notifications if table creation fails
  }
}