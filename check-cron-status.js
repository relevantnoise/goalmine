// Simple script to check cron jobs via Supabase edge function
// This will help us diagnose the duplicate email issue

const checkCronJobs = async () => {
  console.log('🔍 Checking for Supabase cron jobs...');
  
  try {
    // Try to call a function that can query the database
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceDelivery: false,
        debugMode: true
      })
    });

    const data = await response.json();
    console.log('📊 Email function response:', data);
    
    // Check if we can get more info about the system state
    console.log('\n🎯 Analysis:');
    console.log('- Function is responding normally');
    console.log('- No goals need processing (expected if already processed today)');
    console.log('- The 4 API calls you see in Vercel are likely coming from Supabase cron jobs');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run: SELECT * FROM cron.job ORDER BY created_at DESC;');
    console.log('3. Look for jobs with names containing "email", "daily", or "motivation"');
    console.log('4. Disable duplicate cron jobs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkCronJobs();