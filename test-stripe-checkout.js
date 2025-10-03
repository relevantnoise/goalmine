// Test both checkout endpoints to see which price IDs they return
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testPersonalPlanCheckout() {
  try {
    console.log('🧪 Testing Personal Plan checkout...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2',
        tier: 'personal'  // Personal Plan
      })
    });

    console.log('📊 Personal Plan response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Personal Plan response:', responseText);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testStrategicAdvisoryCheckout() {
  try {
    console.log('🧪 Testing Strategic Advisory checkout...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2',
        tier: 'strategic_advisory'  // Strategic Advisory
      })
    });

    console.log('📊 Strategic Advisory response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Strategic Advisory response:', responseText);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBothCheckouts() {
  await testPersonalPlanCheckout();
  console.log('');
  await testStrategicAdvisoryCheckout();
}

testBothCheckouts();