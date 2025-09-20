import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found (length: ' + supabaseKey.length + ')' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testing database queries...');
    
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .limit(3);
    
    if (goalsError) throw goalsError;
    console.log('✅ Goals table:', goals?.length || 0, 'records');
    
    const { data: nudges, error: nudgesError } = await supabase
      .from('daily_nudges')
      .select('*')
      .limit(3);
    
    if (nudgesError) throw nudgesError;
    console.log('✅ Daily nudges table:', nudges?.length || 0, 'records');
    
    const { data: subscribers, error: subsError } = await supabase
      .from('subscribers')
      .select('*')
      .limit(3);
    
    if (subsError) throw subsError;
    console.log('✅ Subscribers table:', subscribers?.length || 0, 'records');
    
    console.log('\n🎉 All database connections successful!');
    console.log('✅ Direct Supabase access is working perfectly!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
