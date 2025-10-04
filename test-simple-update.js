// Simple test to identify the exact issue with goal updates
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testSimpleUpdate() {
  try {
    console.log('🧪 Testing simple goal update...');

    // Let's try with minimal data first
    const testData = {
      goalId: '8a0349d0-6c7e-4564-b1e3-53b13cb9ec96',
      userId: 'danlynn@gmail.com',
      updates: {
        title: 'Test Update ' + Date.now()
      }
    };

    console.log('📤 Sending request:', testData);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-goal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok) {
      console.log('✅ Update succeeded!');
    } else {
      console.log('❌ Update failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleUpdate();