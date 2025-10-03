// Test the simplest possible goal update to isolate the issue
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testSimpleGoalUpdate() {
  try {
    console.log('🧪 Testing simplest possible goal update...');

    const goalId = '8a0349d0-6c7e-4564-b1e3-53b13cb9ec96';
    const userId = 'bWnU7yuQnqSWNqfgJpBX06qlTgC3';  // Use Firebase UID directly

    const response = await fetch(`${SUPABASE_URL}/functions/v1/simple-update-goal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId,
        userId,
        updates: {
          target_date: '2025-12-11'
        }
      })
    });

    console.log('📊 simple-update-goal response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 simple-update-goal response:', responseText);

    if (response.ok) {
      console.log('✅ Simple update works! The issue is with the complex update-goal function.');
    } else {
      console.log('❌ Simple update failed too. The issue is deeper.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleGoalUpdate();