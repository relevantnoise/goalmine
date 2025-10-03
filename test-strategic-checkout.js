// Test the Strategic Advisor Plan checkout directly
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testStrategicAdvisorPlan() {
  try {
    console.log('🧪 Testing Strategic Advisor Plan checkout with explicit tier...');

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
        tier: 'strategic_advisory'  // EXPLICIT Strategic Advisor Plan
      })
    });

    console.log('📊 Strategic Advisor Plan response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Strategic Advisor Plan response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Strategic Advisor Plan checkout URL:', data.url);
      
      // Check if the URL contains the right price
      if (data.url.includes('price_1SCPJLCElVmMOup293vWqNTQ')) {
        console.log('✅ CORRECT: URL contains Strategic Advisor Plan price ID');
      } else if (data.url.includes('price_1RwNO0CElVmMOup2B7WPCzlH')) {
        console.log('❌ WRONG: URL contains Personal Plan price ID');
      } else {
        console.log('❓ Unknown price ID in URL');
      }
    } else {
      console.log('❌ Strategic Advisor Plan checkout failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStrategicAdvisorPlan();