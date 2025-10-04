// Test what happens if we change the date logic to process goals that were already "done" today
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testQueryChange() {
  try {
    console.log('🔍 Testing modified query logic...');

    // Let's test with a body parameter that forces processing regardless of date
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true,
        ignoreLastEmailDate: true // New parameter to force processing
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Results:');
      console.log('📧 Emails sent:', data.emailsSent || 0);
      console.log('❌ Errors:', data.errors || 0);
      console.log('📝 Message:', data.message);
      
      if (data.emailsSent > 0) {
        console.log('🎉 SUCCESS! Emails were sent!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testQueryChange();