import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function checkEmailSetup() {
  console.log('Checking email setup for danlynn@gmail.com...\n');
  
  // Get goals with email settings
  const { data: goalsData } = await supabase.functions.invoke('fetch-user-goals', {
    body: { user_id: 'danlynn@gmail.com' }
  });
  
  if (goalsData?.success) {
    console.log(`Found ${goalsData.goals.length} active goals:\n`);
    
    goalsData.goals.forEach((goal, index) => {
      console.log(`Goal ${index + 1}: "${goal.title}"`);
      console.log(`  - Email time: ${goal.time_of_day || '07:00'} (default 7 AM)`);
      console.log(`  - Tone: ${goal.tone}`);
      console.log(`  - Active: ${goal.is_active}`);
      console.log('');
    });
    
    console.log('📧 EMAIL SCHEDULE:');
    console.log('The daily-cron edge function runs at 7 AM EST and will:');
    console.log('1. Generate fresh motivation content for each goal');
    console.log('2. Send individual emails via Resend');
    console.log(`3. Total emails to be sent: ${goalsData.goals.filter(g => g.is_active).length}`);
    
    // Check last cron run
    console.log('\n📅 CHECKING LAST DAILY CRON RUN...');
    const { data: cronLogs } = await supabase.functions.invoke('get-daily-motivation', {
      body: { 
        userId: 'danlynn@gmail.com',
        goalId: goalsData.goals[0]?.id 
      }
    });
    
    if (cronLogs) {
      console.log('Last motivation generated:', cronLogs);
    }
  } else {
    console.log('Could not fetch goals');
  }
}

checkEmailSetup();