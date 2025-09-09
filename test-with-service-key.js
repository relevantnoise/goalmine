import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass any auth issues
const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDM3NSwiZXhwIjoyMDcwNzY2Mzc1fQ.183iYvXPSTtSl3GeWOwhqk0Rhx17PXVrGVAdADfNjfI'
);

async function testWithServiceKey() {
  console.log('🔑 TESTING WITH SERVICE ROLE KEY...\n');
  
  // Test motivation generation with service role
  try {
    const { data, error } = await supabase.functions.invoke('generate-daily-motivation', {
      body: {
        goalId: 'test-goal-id',
        goalTitle: 'Test Goal',
        goalDescription: 'Testing with service key',
        tone: 'kind_encouraging',
        streakCount: 1,
        userId: 'danlynn@gmail.com',
        targetDate: null,
        isNudge: false
      }
    });
    
    if (error) {
      console.log('❌ Still getting error with service key:', error);
      console.log('Status:', error.context?.status);
      console.log('This suggests the function itself has an issue, not auth');
    } else {
      console.log('✅ Success with service key!');
      console.log('Generated content:', data?.message?.substring(0, 100) + '...');
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
  
  // Also try the send-daily-emails directly
  console.log('\n📧 Testing send-daily-emails with service key...');
  try {
    const { data, error } = await supabase.functions.invoke('send-daily-emails', {
      body: { forceDelivery: true }  // Force delivery regardless of time
    });
    
    if (error) {
      console.log('❌ send-daily-emails error:', error);
    } else {
      console.log('✅ send-daily-emails response:', data);
    }
  } catch (err) {
    console.log('❌ send-daily-emails exception:', err.message);
  }
}

testWithServiceKey();