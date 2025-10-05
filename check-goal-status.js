// Check if goals think they were already processed today
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function checkGoalStatus() {
  try {
    console.log('🔍 Checking goal processing status (READ ONLY)...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: true,
        dryRun: true // This parameter doesn't exist but shows intent
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response:', responseText);

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    console.log('📅 Today\'s date:', todayDate);
    
    if (responseText.includes('No goals need processing')) {
      console.log('⚠️ ISSUE: Goals think they were already processed today');
      console.log('💡 This would prevent the 8:20 PM cron from sending emails');
    } else {
      console.log('✅ Goals appear ready for processing');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkGoalStatus();