// Test the existing create-strategic-advisor-checkout function
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testExistingFunction() {
  try {
    console.log('🧪 Testing create-strategic-advisor-checkout function...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-strategic-advisor-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'https://www.goalmine.ai'
      },
      body: JSON.stringify({
        email: 'dandlynn@yahoo.com',
        userId: '8MZNQ8sG1VfWaBd74A39jNzyZmL2'
      })
    });

    console.log('📊 Response status:', response.status);
    
    if (response.status === 404) {
      console.log('❌ Function not found - create-strategic-advisor-checkout does not exist');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Function exists and works! URL:', data.url);
      
      // Check if URL looks like Stripe checkout
      if (data.url && data.url.includes('checkout.stripe.com')) {
        console.log('✅ Valid Stripe checkout URL generated');
      } else {
        console.log('❌ Invalid checkout URL format');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Function error:', response.status, errorText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testExistingFunction();