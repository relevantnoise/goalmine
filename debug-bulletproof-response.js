// Get the exact error from bulletproof function
import fetch from 'node-fetch';

async function debugBulletproofResponse() {
  console.log('🔍 Getting exact bulletproof function error...\n');

  const testData = {
    user_email: 'danlynn@gmail.com',
    timeContext: {
      work_hours_per_week: 50,
      sleep_hours_per_night: 7.5,
      commute_hours_per_week: 2,
      available_hours_per_week: 70
    },
    circleAllocations: {
      'Spiritual': {
        circle_name: 'Spiritual',
        importance_level: 8,
        current_hours_per_week: 3,
        ideal_hours_per_week: 7
      }
    },
    workHappiness: {
      impact_current: 7,
      impact_desired: 9,
      fun_current: 6,
      fun_desired: 8,
      money_current: 8,
      money_desired: 9,
      remote_current: 9,
      remote_desired: 9
    }
  };

  try {
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/create-simple-circle-framework-bulletproof', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0',
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Response body (raw):', responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('📡 Response body (parsed):', JSON.stringify(responseJson, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON:', parseError.message);
    }

  } catch (error) {
    console.error('🚨 Request failed:', error);
  }
}

debugBulletproofResponse();