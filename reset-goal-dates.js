// Reset goal dates to force email processing
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function resetGoalDates() {
  try {
    console.log('🔄 Calling reset function to clear goal dates...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-goals-for-testing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reset_motivation_dates'
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response:', responseText);

    if (response.ok) {
      console.log('✅ Goals reset successfully!');
      
      // Now test the email function again
      console.log('\n🚀 Testing email function after reset...');
      
      const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceDelivery: true
        })
      });

      const emailData = await emailResponse.text();
      console.log('📧 Email function result:', emailData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetGoalDates();