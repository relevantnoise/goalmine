// Check if there are duplicate goals causing the update issue

const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function checkDuplicateGoals() {
  try {
    console.log('🔍 Checking for duplicate goals...');

    // First, get all goals for this user (both email and Firebase UID)
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
    console.log('📊 All goals found:', goalsData.goals?.length || 0);
    
    if (goalsData.goals) {
      goalsData.goals.forEach((goal, index) => {
        console.log(`Goal ${index + 1}:`, {
          id: goal.id,
          user_id: goal.user_id,
          title: goal.title.substring(0, 30) + '...',
          target_date: goal.target_date,
          created_at: goal.created_at
        });
      });

      // Check for goals with same ID
      const goalId = 'dae2616f-dd2a-41ef-9b49-d90e5c310644';
      const matchingGoals = goalsData.goals.filter(goal => goal.id === goalId);
      
      console.log(`🎯 Goals with ID ${goalId}:`, matchingGoals.length);
      matchingGoals.forEach((goal, index) => {
        console.log(`  Match ${index + 1}:`, {
          id: goal.id,
          user_id: goal.user_id,
          user_id_type: goal.user_id.includes('@') ? 'email' : 'firebase-uid'
        });
      });

      if (matchingGoals.length > 1) {
        console.log('🚨 DUPLICATE GOALS FOUND! This could cause the "Cannot coerce" error.');
        console.log('🔧 The update query might be matching multiple rows.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDuplicateGoals();