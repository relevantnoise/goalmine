// Test adding circle columns to goals table
import fetch from 'node-fetch';

async function testAddColumns() {
  console.log('🔧 Testing add-circle-columns function...\n');

  try {
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/add-circle-columns', {
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
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON');
      }
    }

  } catch (error) {
    console.error('🚨 Request failed:', error);
  }
}

testAddColumns();