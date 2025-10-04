// Test the bulletproof email system
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testBulletproofEmails() {
  try {
    console.log('🚀 Testing bulletproof email system...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
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
      console.log('✅ Bulletproof email system test results:');
      console.log('📧 Emails sent:', data.emailsSent || 0);
      console.log('❌ Errors:', data.errors || 0);
      console.log('📝 Message:', data.message);
    } else {
      console.log('❌ Email system test failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBulletproofEmails();