// Test direct database update to isolate the issue

const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testDirectUpdate() {
  try {
    console.log('🧪 Testing direct database update...');

    const goalId = 'dae2616f-dd2a-41ef-9b49-d90e5c310644';
    const userId = '8MZNQ8sG1VfWaBd74A39jNzyZmL2';

    // Try a simple update via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${goalId}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        target_date: '2025-12-09',
        updated_at: new Date().toISOString()
      })
    });

    console.log('📊 Direct update response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Direct update response:', responseText);

    if (response.ok) {
      console.log('✅ Direct update worked! The issue is with the edge function.');
    } else {
      console.log('❌ Direct update failed too. Likely RLS or constraint issue.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectUpdate();