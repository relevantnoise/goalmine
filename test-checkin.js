// Test script to reproduce the check-in issue for dandlynn@yahoo.com

const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testCheckin() {
  try {
    // First, let's get dandlynn's goals to see what goalId to use
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
    console.log('📋 Goals data for dandlynn@yahoo.com:', JSON.stringify(goalsData, null, 2));
    console.log('📊 Goal count:', goalsData.goals?.length || 0);
    
    if (goalsData.goals && goalsData.goals.length > 0) {
      goalsData.goals.forEach((goal, index) => {
        console.log(`📊 Goal ${index + 1}:`, {
          id: goal.id,
          title: goal.title.substring(0, 50) + '...',
          target_date: goal.target_date,
          formatted_date: formatDateLikeGoalCard(goal.target_date),
          is_expired: isGoalExpired(goal.target_date)
        });
      });
    }

    if (!goalsData.goals || goalsData.goals.length === 0) {
      console.log('❌ No goals found for dandlynn@yahoo.com');
      return;
    }

    const goalId = goalsData.goals[0].id;
    console.log('🎯 Testing check-in for goal:', goalId);

    // Now test the check-in function exactly as the frontend calls it
    const checkinResponse = await fetch(`${SUPABASE_URL}/functions/v1/check-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId: goalId,
        userId: 'dandlynn@yahoo.com'
      })
    });

    console.log('📊 Check-in response status:', checkinResponse.status);
    console.log('📊 Check-in response headers:', Object.fromEntries(checkinResponse.headers));

    const checkinData = await checkinResponse.text();
    console.log('📊 Check-in response body:', checkinData);

    try {
      const parsedData = JSON.parse(checkinData);
      console.log('📊 Parsed check-in response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('❌ Could not parse response as JSON');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('❌ Full error:', error);
  }
}

testCheckin();