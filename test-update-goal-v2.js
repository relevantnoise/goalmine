// Test if update-goal-v2 function exists and works
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testUpdateGoalV2() {
  try {
    console.log('🧪 Testing update-goal-v2 function...');

    const goalId = '8a0349d0-6c7e-4564-b1e3-53b13cb9ec96';
    const userId = 'danlynn@gmail.com';  // Test with email to see if hybrid works

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-goal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId,
        userId,
        updates: {
          target_date: '2025-12-10'
        }
      })
    });

    console.log('📊 update-goal-v2 response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 update-goal-v2 response:', responseText);

    if (response.ok) {
      console.log('✅ update-goal-v2 works!');
    } else {
      console.log('❌ update-goal-v2 failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpdateGoalV2();