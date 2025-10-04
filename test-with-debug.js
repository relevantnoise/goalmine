// Test the send-daily-emails function with detailed debugging
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testWithDebug() {
  try {
    console.log('🚀 Testing send-daily-emails with force delivery...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Full response text:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n📧 Parsed response:');
      console.log('✅ Success:', data.success);
      console.log('📧 Emails sent:', data.emailsSent);
      console.log('❌ Errors:', data.errors);
      console.log('📝 Message:', data.message);
      
      if (data.debug) {
        console.log('\n🔍 Debug info:', data.debug);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithDebug();