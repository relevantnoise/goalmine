// Test which edge functions actually exist
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testFunctionExists(functionName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });

    console.log(`📊 ${functionName}: ${response.status}`);
    if (response.status === 404) {
      console.log(`❌ ${functionName} does not exist`);
    } else {
      console.log(`✅ ${functionName} exists`);
    }
  } catch (error) {
    console.log(`❌ ${functionName}: Error - ${error.message}`);
  }
}

async function testAllFunctions() {
  console.log('🔍 Testing which functions exist...');
  
  await testFunctionExists('update-goal');
  await testFunctionExists('update-goal-v2');
  await testFunctionExists('simple-update-goal');
  await testFunctionExists('fetch-user-goals');
  await testFunctionExists('check-in');
}

testAllFunctions();