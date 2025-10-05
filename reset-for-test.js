// Reset goals for today's 8:20 PM cron test by calling the send-daily-emails function with reset
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function resetForTest() {
  try {
    console.log('🔄 Resetting goals for 8:20 PM cron test...');
    console.log('This will clear last_motivation_date so goals appear as needing processing');

    // The send-daily-emails function has reset logic built in
    // Let me call it with a special parameter to just do the reset part
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true,
        resetOnly: true // This will trigger the reset but not send emails
      })
    });

    console.log('📊 Reset response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Reset response:', responseText);

    // Now check if goals are ready
    console.log('\n🔍 Checking if goals are now ready for processing...');
    
    const checkResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: false, // Don't force - check normal conditions
        dryRun: true
      })
    });

    const checkText = await checkResponse.text();
    console.log('📊 Check response:', checkText);

    if (checkText.includes('candidateGoals')) {
      const data = JSON.parse(checkText);
      if (data.debug && data.debug.candidateGoals > 0) {
        console.log('✅ SUCCESS! Goals are now ready for the 8:20 PM cron test');
        console.log(`📧 ${data.debug.candidateGoals} goals ready for processing`);
      } else {
        console.log('❌ Goals still not ready - reset may have failed');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetForTest();