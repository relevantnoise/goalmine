// Fix dandlynn's goal to have correct 2025 target date

const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function fixDandlynnGoal() {
  try {
    console.log('🔧 Fixing dandlynn\'s goal target date...');

    // First, get the current goal data
    const goalsResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-user-goals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'dandlynn@yahoo.com'
      })
    });

    const goalsData = await goalsResponse.json();
    
    if (!goalsData.goals || goalsData.goals.length === 0) {
      console.log('❌ No goals found for dandlynn@yahoo.com');
      return;
    }

    const goal = goalsData.goals[0];
    console.log('📊 Current goal data:', {
      id: goal.id,
      title: goal.title,
      current_target_date: goal.target_date,
      created_at: goal.created_at
    });

    // Update the goal with correct 2025 date using emergency fix function
    const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/fix-dandlynn-date`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log('📊 Update response status:', updateResponse.status);
    const updateData = await updateResponse.text();
    console.log('📊 Update response:', updateData);

    if (updateResponse.ok) {
      console.log('✅ Successfully updated dandlynn\'s goal target date to 2025-12-06');
      
      // Verify the update worked
      const verifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-user-goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'dandlynn@yahoo.com'
        })
      });

      const verifyData = await verifyResponse.json();
      const updatedGoal = verifyData.goals[0];
      console.log('✅ Verified updated goal:', {
        id: updatedGoal.id,
        new_target_date: updatedGoal.target_date,
        is_future_date: new Date(updatedGoal.target_date) > new Date()
      });
    } else {
      console.log('❌ Failed to update goal');
    }

  } catch (error) {
    console.error('❌ Error fixing goal:', error.message);
  }
}

fixDandlynnGoal();