import { db } from './db';
import { sql } from 'drizzle-orm';

export async function runMigration() {
  try {
    // Add missing columns if they don't exist
    await db.execute(sql`
      ALTER TABLE transcriptions 
      ADD COLUMN IF NOT EXISTS video_title TEXT;
    `);
    
    await db.execute(sql`
      ALTER TABLE transcriptions 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';
    `);
    
    // Check the actual table structure
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'transcriptions' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Migration completed: columns added');
    console.log('Current transcriptions table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
  } catch (error) {
    console.error('Migration error:', error);
  }
}