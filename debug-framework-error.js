// Debug the framework creation error by capturing the response body
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhlcycjnzwfnadmsptof.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFrameworkError() {
  console.log('🔍 Debugging create-simple-circle-framework error...\n');

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
    // Make direct fetch call to get detailed error response
    const response = await fetch(`${supabaseUrl}/functions/v1/create-simple-circle-framework`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Response body (raw):', responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('📡 Response body (parsed):', responseJson);
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON:', parseError.message);
    }

  } catch (error) {
    console.error('🚨 Debug failed:', error);
  }
}

debugFrameworkError();