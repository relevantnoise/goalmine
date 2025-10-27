// Get SQL schema from setup-circle-database function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchemaSQL() {
  console.log('📋 Getting SQL schema from setup-circle-database function...\n');

  try {
    const { data, error } = await supabase.functions.invoke('setup-circle-database');

    if (error) {
      console.log('❌ Function error:', error);
    } else {
      console.log('✅ Function response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.sql_to_run) {
        console.log('\n📝 SQL TO RUN IN SUPABASE SQL EDITOR:');
        console.log('='.repeat(50));
        console.log(data.sql_to_run);
        console.log('='.repeat(50));
      }
    }
  } catch (error) {
    console.error('🚨 Failed to get schema:', error);
  }
}

getSchemaSQL();