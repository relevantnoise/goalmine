// Debug what dates are in the database
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function debugGoalDates() {
  try {
    console.log('🔍 Checking goal dates in database...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/goals?select=id,title,user_id,last_motivation_date,is_active`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    const goals = await response.json();
    
    console.log('📊 Found', goals.length, 'goals total');
    
    const now = new Date();
    const todayUTC = now.toISOString().split('T')[0];
    
    console.log('📅 Today UTC:', todayUTC);
    console.log('🕐 Current time:', now.toISOString());
    
    goals.forEach(goal => {
      console.log(`\n📧 Goal: "${goal.title}"`);
      console.log(`   User: ${goal.user_id}`);
      console.log(`   Active: ${goal.is_active}`);
      console.log(`   Last email: ${goal.last_motivation_date || 'NEVER'}`);
      console.log(`   Needs email: ${!goal.last_motivation_date || goal.last_motivation_date < todayUTC ? 'YES' : 'NO'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugGoalDates();