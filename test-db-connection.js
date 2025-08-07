#!/usr/bin/env node

// Simple database connection test script
import { pool, db } from './server/db.js';
import { users, transcriptions } from './shared/schema.js';
import { count } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 Testing AWS RDS Database Connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing pool connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ Database connected successfully');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}\n`);
    client.release();
    
    // Test Drizzle ORM
    console.log('2. Testing Drizzle ORM...');
    const userCount = await db.select({ count: count() }).from(users);
    const transcriptionCount = await db.select({ count: count() }).from(transcriptions);
    
    console.log('✅ Drizzle ORM working correctly');
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Transcriptions: ${transcriptionCount[0].count}\n`);
    
    // Test table structure
    console.log('3. Checking table structure...');
    const tableInfo = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    
    const tables = {};
    tableInfo.rows.forEach(row => {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    });
    
    Object.entries(tables).forEach(([tableName, columns]) => {
      console.log(`   📋 ${tableName}: ${columns.length} columns`);
    });
    
    console.log('\n🎉 All database tests passed! AWS RDS is ready for use.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection().catch(console.error);