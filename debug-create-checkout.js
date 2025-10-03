// Debug the create-checkout function directly
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function debugCreateCheckout() {
  console.log('🔍 Testing both scenarios...\n');

  // Test 1: Personal Plan (no tier)
  console.log('=== TEST 1: PERSONAL PLAN (no tier) ===');
  try {
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2'
        // NO tier parameter
      })
    });

    const data1 = await response1.json();
    console.log('Personal Plan URL:', data1.url);
    
    if (data1.url?.includes('price_1RwNO0CElVmMOup2B7WPCzlH')) {
      console.log('✅ CORRECT: Personal Plan price ID detected');
    } else if (data1.url?.includes('price_1SCPJLCElVmMOup293vWqNTQ')) {
      console.log('❌ WRONG: Strategic Advisor Plan price ID detected');
    } else {
      console.log('❓ Unknown price ID');
    }
  } catch (error) {
    console.error('❌ Personal Plan test failed:', error.message);
  }

  console.log('\n=== TEST 2: STRATEGIC ADVISOR PLAN (tier: strategic_advisory) ===');
  try {
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2',
        tier: 'strategic_advisory'  // EXPLICIT tier
      })
    });

    const data2 = await response2.json();
    console.log('Strategic Advisor Plan URL:', data2.url);
    
    if (data2.url?.includes('price_1SCPJLCElVmMOup293vWqNTQ')) {
      console.log('✅ CORRECT: Strategic Advisor Plan price ID detected');
    } else if (data2.url?.includes('price_1RwNO0CElVmMOup2B7WPCzlH')) {
      console.log('❌ WRONG: Personal Plan price ID detected');
    } else {
      console.log('❓ Unknown price ID');
    }
  } catch (error) {
    console.error('❌ Strategic Advisor Plan test failed:', error.message);
  }
}

debugCreateCheckout();