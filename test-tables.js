// Test if circle framework tables exist
import fetch from 'node-fetch';

async function testCircleTables() {
  console.log('🔍 Testing if circle framework tables exist...\n');

  try {
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/create-circle-tables', {
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
    console.log('📡 Response body:', responseText);

    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📡 Parsed response:', JSON.stringify(responseJson, null, 2));
        
        if (responseJson.success) {
          console.log('✅ TABLES EXIST! Circle framework tables are ready to use.');
        } else {
          console.log('❌ TABLES MISSING:', responseJson.error);
          console.log('💡 Solution:', responseJson.solution || 'Need to create tables');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON');
      }
    }

  } catch (error) {
    console.error('🚨 Request failed:', error);
  }
}

testCircleTables();