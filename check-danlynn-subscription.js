// Quick script to check danlynn@gmail.com subscription status
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function checkSubscription() {
  console.log('Checking danlynn@gmail.com subscription...\n');
  
  // Check subscribers table
  const { data: sub, error: subError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('user_id', 'danlynn@gmail.com')
    .single();
    
  console.log('Subscribers table record:');
  console.log(JSON.stringify(sub, null, 2));
  
  // Count goals
  const { data: goals, count } = await supabase
    .from('goals')
    .select('id, title', { count: 'exact' })
    .eq('user_id', 'danlynn@gmail.com')
    .eq('is_active', true);
    
  console.log('\nActive goals count:', count);
  console.log('Goals:', goals?.map(g => g.title));
  
  // The key insight
  console.log('\n=== SUBSCRIPTION CHECK LOGIC ===');
  console.log('subscriber?.subscribed:', sub?.subscribed);
  console.log('subscriber?.status:', sub?.status);
  console.log('Backend checks: subscriber?.subscribed === true');
  console.log('Result: isSubscribed =', sub?.subscribed === true);
}

checkSubscription();