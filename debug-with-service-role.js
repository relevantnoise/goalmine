// Debug using the service role key instead of anon key
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";

async function debugWithServiceRole() {
  try {
    console.log('🔍 Checking goals with direct database access...');

    // Try calling the actual send-daily-emails function to see what it finds
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true,
        debug: true
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Full response:', responseText);

    // Also check what the query actually returns
    console.log('\n🔍 Raw database query check:');
    const todayDate = new Date().toISOString().split('T')[0];
    console.log('📅 Today date for query:', todayDate);
    
    const directQuery = await fetch(`${SUPABASE_URL}/rest/v1/goals?select=*&is_active=eq.true`, {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0'
      }
    });
    
    const directData = await directQuery.json();
    console.log('📊 Direct query result:', directData);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWithServiceRole();