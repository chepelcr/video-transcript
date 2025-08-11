import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Build AWS RDS connection string if credentials are available
let databaseUrl = process.env.DATABASE_URL;

if (process.env.AWS_RDS_DATABASE_URL && process.env.AWS_RDS_USERNAME && process.env.AWS_RDS_PASSWORD && process.env.AWS_RDS_DATABASE_NAME) {
  // Construct proper PostgreSQL connection string
  const host = process.env.AWS_RDS_DATABASE_URL;
  const username = encodeURIComponent(process.env.AWS_RDS_USERNAME);
  const password = encodeURIComponent(process.env.AWS_RDS_PASSWORD);
  const database = process.env.AWS_RDS_DATABASE_NAME === 'video-transcipt' ? 'video-transcript' : process.env.AWS_RDS_DATABASE_NAME;
  const port = process.env.AWS_RDS_PORT || '5432';
  
  databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  console.log('✅ Using AWS RDS connection');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
} else {
  console.log('⚠️ Using fallback DATABASE_URL');
  console.log('   Missing AWS RDS credentials');
}

if (!databaseUrl) {
  throw new Error(
    "AWS_RDS_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');
console.log('Database host:', databaseUrl.includes('amazonaws.com') ? 'AWS RDS' : 'Other');

// Validate the connection string format
if (!databaseUrl || (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://'))) {
  console.error('Invalid database URL format. Expected postgresql:// or postgres:// prefix');
  throw new Error('Invalid database URL format. Must start with postgresql:// or postgres://');
}

console.log('Database connection configured successfully');

// Configure connection pool for AWS RDS PostgreSQL
const poolConfig: any = {
  connectionString: databaseUrl,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Increase timeout for AWS RDS
};

// Handle SSL for AWS RDS
if (databaseUrl.includes('amazonaws.com')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined, // Skip server identity check
  };
}

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const db = drizzle(pool, { schema });

export const connectDatabase = async () => {
  try {
    console.log('🗄️ Connecting to AWS RDS PostgreSQL database...');
    // Test connection
    await pool.connect();
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
    
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" VARCHAR NOT NULL,
        type VARCHAR NOT NULL DEFAULT 'system',
        title VARCHAR NOT NULL,
        message TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt")');
    
    client.release();
    console.log('✅ Notifications table created successfully');
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    // Don't throw error - continue without notifications if table creation fails
  }
}