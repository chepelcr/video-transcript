import { db } from './db';
import { sql } from 'drizzle-orm';

export async function runMigration() {
  try {
    // Add video_title column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE transcriptions 
      ADD COLUMN IF NOT EXISTS video_title TEXT;
    `);
    
    console.log('Migration completed: video_title column added');
  } catch (error) {
    console.error('Migration error:', error);
  }
}