// Manual fix by calling update-goal with detailed debugging

const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function manualFix() {
  try {
    console.log('🔧 Manual fix attempt with proper data structure...');

    // Call update-goal with the exact parameters the frontend would use
    const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/update-goal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId: 'dae2616f-dd2a-41ef-9b49-d90e5c310644',
        userId: 'dandlynn@yahoo.com',
        updates: {
          target_date: '2025-12-06'
        }
      })
    });

    console.log('📊 Update response status:', updateResponse.status);
    console.log('📊 Update response headers:', Object.fromEntries(updateResponse.headers));
    
    const responseText = await updateResponse.text();
    console.log('📊 Raw response text:', responseText);

    // Try to parse as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log('📊 Parsed response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('❌ Could not parse response as JSON');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

manualFix();