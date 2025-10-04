// Test if we can bypass RLS entirely to see the goals
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testRLSBypass() {
  try {
    console.log('🔍 Testing direct edge function to bypass RLS...');

    // Create a simple edge function test that uses service role
    const response = await fetch(`${SUPABASE_URL}/functions/v1/simple-db-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'goals',
        action: 'count_all'
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response:', responseText);

    // If that doesn't work, let's test with a very specific debugging approach
    console.log('\n🔍 Testing specific goal IDs...');
    
    // Test the known goal IDs directly
    const goalIds = [
      '8a0349d0-6c7e-4564-b1e3-53b13cb9ec96',  // danlynn
      'dae2616f-dd2a-41ef-9b49-d90e5c310644'   // dandlynn
    ];
    
    for (const goalId of goalIds) {
      const goalResponse = await fetch(`${SUPABASE_URL}/rest/v1/goals?select=*&id=eq.${goalId}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      const goalData = await goalResponse.json();
      console.log(`📧 Goal ${goalId}:`, goalData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRLSBypass();