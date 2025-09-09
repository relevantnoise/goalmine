// Test script to verify the cron will work

async function testCronTrigger() {
  console.log('🧪 Testing cron trigger locally...\n');
  
  try {
    // Test calling the Supabase function directly
    console.log('1. Testing direct Supabase function call...');
    const response = await fetch(
      'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error from Supabase:', data);
    } else {
      console.log('✅ Success! Response:', data);
      
      if (data.details) {
        console.log('\n📊 Email Statistics:');
        console.log(`- Daily emails sent: ${data.details.dailyEmails.emailsSent}`);
        console.log(`- Daily email errors: ${data.details.dailyEmails.errors}`);
        console.log(`- Message: ${data.details.dailyEmails.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
  
  console.log('\n📝 NOTES:');
  console.log('- The cron is scheduled for 11:00 UTC (7:00 AM EST / 6:00 AM CST)');
  console.log('- Vercel will automatically call /api/trigger-daily-emails at this time');
  console.log('- The API route then triggers the Supabase daily-cron function');
  console.log('- Make sure to set VITE_SUPABASE_ANON_KEY in Vercel environment variables');
}

testCronTrigger();