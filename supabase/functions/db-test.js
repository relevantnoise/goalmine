require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { BADHINTS } = require('dns');
const { calculateActiveTickIndex } = require('recharts/types/util/ChartUtils');
const { nodeModuleNameResolver } = require('typescript');

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test 1: List all tables
    console.log('1. Fetching list of tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tablesError) throw tablesError;
    console.log('✅ Successfully connected to database!\n');
    
    // Test 2: Count users
    console.log('2. Counting users...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`✅ Found ${count} users in database\n`);
    
    // Test 3: Check nudge_history table
    console.log('3. Checking nudge_history table...');
    const { data: nudges, error: nudgeError } = await supabase
      .from('nudge_history')
      .select('id')
      .limit(1);
    
    if (nudgeError) throw nudgeError;
    console.log('✅ Nudge history table accessible\n');
    
    // Test 4: Show a sample user (without sensitive data)
    console.log('4. Fetching sample user data...');
    const { data: sampleUser, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_status, created_at')
      .limit(1);
    
    if (userError) throw userError;
    if (sampleUser && sampleUser.length > 0) {
      console.log('Sample user:', {
        id: sampleUser[0].id.substring(0, 8) + '...',
        email: sampleUser[0].email.substring(0, 3) + '***',
        subscription_status: sampleUser[0].subscription_status,
        created_at: sampleUser[0].created_at
      });
    }
    
    console.log('\n🎉 All tests passed! Your Supabase connection is working perfectly.');
    console.log('You can now make database changes directly from Cursor!\n');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your .env.local file has the correct NEXT_PUBLIC_SUPABASE_URL');
    console.error('2. Your .env.local file has the correct SUPABASE_SERVICE_ROLE_KEY');
    console.error('3. Both values are from your Supabase project settings');
  }
}
testConnection();