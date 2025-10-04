// Test the manual email function
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testManualFunction() {
  try {
    console.log('🚀 Testing manual email function...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails-manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true // Override time window for testing
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Manual email function test results:');
      console.log('📧 Emails sent:', data.emailsSent || 0);
      console.log('❌ Errors:', data.errors || 0);
      console.log('📝 Message:', data.message);
      console.log('🔧 Approach:', data.approach);
      
      if (data.emailsSent > 0) {
        console.log('🎉 SUCCESS! Emails were actually sent!');
        console.log('📧 Check danlynn@gmail.com and dandlynn@yahoo.com inboxes!');
      }
    } else {
      console.log('❌ Manual function test failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testManualFunction();