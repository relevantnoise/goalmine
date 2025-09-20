import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function fixSubscription() {
  console.log('Fixing danlynn@gmail.com subscription...\n');
  
  // Use the update-subscription edge function
  const { data, error } = await supabase.functions.invoke('update-subscription', {
    body: {
      userId: 'danlynn@gmail.com',
      planName: 'Personal Plan',
      status: 'active'
    }
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Success:', data);
  
  // Verify the fix
  const { data: sub } = await supabase
    .from('subscribers')
    .select('*')
    .eq('user_id', 'danlynn@gmail.com')
    .single();
    
  console.log('\nVerification - Subscriber record:');
  console.log('subscribed:', sub?.subscribed);
  console.log('status:', sub?.status);
  console.log('plan_name:', sub?.plan_name);
}

fixSubscription();