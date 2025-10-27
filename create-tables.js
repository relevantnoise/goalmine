// Create circle framework tables now
import fetch from 'node-fetch';

async function createTables() {
  console.log('🔨 Creating circle framework tables...\n');

  try {
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/create-tables-now', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0',
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0'
      },
      body: JSON.stringify({})
    });

    console.log('📡 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📡 Response:', responseText);

    const responseJson = JSON.parse(responseText);
    if (responseJson.success) {
      console.log('\n🎉 SUCCESS! Tables created successfully!');
      console.log('✅ user_circle_frameworks');
      console.log('✅ circle_time_allocations'); 
      console.log('✅ work_happiness_metrics');
      console.log('\nNow we can capture the 5 Circle Framework data! 🎯');
    } else {
      console.log('\n❌ Failed:', responseJson.error);
    }

  } catch (error) {
    console.error('🚨 Failed to create tables:', error);
  }
}

createTables();