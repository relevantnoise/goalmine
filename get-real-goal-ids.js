// Get the real goal IDs that actually exist
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function getRealGoalIds() {
  try {
    console.log('🔍 Getting real goal data with service role access...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/simple-db-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'detailed_goals',
        action: 'get_all'
      })
    });

    const data = await response.json();
    console.log('📊 Real goal data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getRealGoalIds();