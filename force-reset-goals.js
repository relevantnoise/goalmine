// Force reset goal dates directly using REST API
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function forceResetGoals() {
  try {
    console.log('🔄 Force resetting goal dates via REST API...');

    // Try to update goals where is_active is true
    const response = await fetch(`${SUPABASE_URL}/rest/v1/goals?is_active=eq.true`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        last_motivation_date: null
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response text:', responseText);

    if (response.ok && responseText !== '[]') {
      console.log('✅ Goals reset successfully!');
      
      // Now test the email function
      console.log('\n🚀 Testing email function after force reset...');
      
      const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-daily-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceDelivery: true
        })
      });

      const emailData = await emailResponse.text();
      console.log('📧 Email function result:', emailData);
    } else {
      console.log('❌ Reset failed - likely RLS blocking the update');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceResetGoals();