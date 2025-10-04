// Test the trigger endpoint manually to see what happened
async function testTriggerManual() {
  try {
    console.log('🔍 Testing trigger endpoint manually...');

    // Test the actual trigger endpoint that the cron calls
    const response = await fetch('https://goalmine.ai/api/trigger-daily-emails', {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Cron/1.0'
      }
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Trigger endpoint results:');
      console.log('📧 Emails sent:', data.emailsSent || 0);
      console.log('❌ Errors:', data.errors || 0);
      console.log('📝 Details:', data.details);
      console.log('🏠 Environment:', data.environment);
    } else {
      console.log('❌ Trigger endpoint failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTriggerManual();