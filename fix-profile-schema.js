import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.183iYvXPSTtSl3GeWOwhqk0Rhx17PXVrGVAdADfNjfI';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function fixProfileSchema() {
  try {
    console.log('🔧 Fixing profiles table schema for Firebase...');
    
    // Check current table structure
    const { data: currentProfiles, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (queryError) {
      console.error('Error querying profiles:', queryError);
      return;
    }
    
    console.log('✅ Current profiles table accessible');
    
    // Test Firebase user creation with string ID
    const testFirebaseUser = {
      id: 'firebase-test-' + Date.now(), // String ID instead of UUID
      email: 'firebase-test@example.com',
      clerk_uuid: 'WhLwnJunfhXerzLmLuAm3IVvS1y1', // Firebase UID
      trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('🧪 Testing Firebase user creation...');
    
    const { data: testResult, error: testError } = await supabase
      .from('profiles')
      .insert([testFirebaseUser])
      .select();
    
    if (testError) {
      console.log('❌ Schema issue confirmed:', testError.message);
      
      if (testError.message.includes('uuid')) {
        console.log('\n🔧 The profiles.id column needs to accept TEXT instead of UUID');
        console.log('📝 Database admin action required:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Run: ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;');
        console.log('   3. This will allow Firebase string IDs');
        
        return {
          success: false,
          action: 'schema_change_needed',
          solution: 'ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;'
        };
      }
    } else {
      console.log('✅ Schema works! Test user created:', testResult);
      
      // Clean up test user
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testFirebaseUser.id);
        
      console.log('🧹 Test user cleaned up');
      
      return {
        success: true,
        message: 'Schema is compatible with Firebase'
      };
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

fixProfileSchema().then(result => {
  console.log('\n🎯 Result:', result);
});