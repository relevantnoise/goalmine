// Test the new strategic-checkout function
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testNewStrategicCheckout() {
  try {
    console.log('🧪 Testing new strategic-checkout function...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/strategic-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2'
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response:', responseText);

    if (response.status === 404) {
      console.log('❌ Function not deployed yet - need to deploy strategic-checkout function');
    } else if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Strategic checkout URL created:', data.url);
    } else {
      console.log('❌ Function error:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewStrategicCheckout();