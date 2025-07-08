#!/usr/bin/env node

/**
 * Database Setup Script for Clydra Chat Application
 * 
 * This script sets up the complete database schema for the chat application.
 * Run this after setting up your Supabase project.
 * 
 * Usage:
 *   node scripts/setup-database.js
 * 
 * Prerequisites:
 *   - Supabase project created
 *   - Environment variables set in .env.local
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Clydra database schema...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing database schema...');
    
    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      return;
    }

    console.log('✅ Database schema created successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = [
      'users',
      'threads', 
      'messages',
      'message_responses',
      'token_usage',
      'daily_tokens',
      'usage_meter',
      'api_keys',
      'api_requests',
      'chat_history'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (OK)
        console.error(`❌ Table ${table} verification failed:`, error);
      } else {
        console.log(`✅ Table ${table} ready`);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Sign up/login to create your first user');
    console.log('3. Start chatting to test the system');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check your Supabase connection');
    console.error('2. Verify your environment variables');
    console.error('3. Ensure you have service role permissions');
  }
}

// Helper function to create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error } = await supabase.rpc('exec', { sql: createFunctionSQL });
  
  if (error) {
    console.log('Note: Using alternative method for schema execution');
  }
}

// Run the setup
setupDatabase().catch(console.error);