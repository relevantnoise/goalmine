import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function testSubscription() {
  console.log('Testing subscription check for danlynn@gmail.com...\n');
  
  // Use the check-subscription edge function (what the app uses)
  const { data, error } = await supabase.functions.invoke('check-subscription', {
    body: {
      userId: 'danlynn@gmail.com',
      email: 'danlynn@gmail.com'
    }
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('check-subscription response:');
  console.log(JSON.stringify(data, null, 2));
  
  // Now try creating a 4th goal
  console.log('\nTrying to create a 4th goal...');
  const { data: goalData, error: goalError } = await supabase.functions.invoke('create-goal', {
    body: {
      user_id: 'danlynn@gmail.com',
      title: 'Test Goal 4',
      description: 'Testing limit enforcement',
      tone: 'kind_encouraging',
      time_of_day: '09:00'
    }
  });
  
  if (goalError) {
    console.log('Goal creation blocked (good!):', goalError);
  } else if (goalData?.error) {
    console.log('Goal creation blocked (good!):', goalData.error);
  } else {
    console.log('ERROR: Goal was created! Limit not enforced!');
    console.log(goalData);
  }
}

testSubscription();