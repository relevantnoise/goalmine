import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function checkCronSetup() {
  console.log('🕐 CHECKING EMAIL AUTOMATION SETUP...\n');
  
  // Try to manually trigger the daily cron to see what happens
  console.log('Testing daily-cron function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('daily-cron');
    
    if (error) {
      console.log('❌ Daily cron error:', error);
    } else {
      console.log('✅ Daily cron response:', data);
    }
    
    // Check if there are any goals that would qualify for emails
    console.log('\nChecking goals that would get emails...');
    
    const { data: testEmail, error: emailError } = await supabase.functions.invoke('send-daily-emails');
    
    if (emailError) {
      console.log('❌ Send daily emails error:', emailError);
    } else {
      console.log('✅ Send daily emails response:', testEmail);
    }
    
  } catch (err) {
    console.log('Error testing:', err);
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('The system depends on either:');
  console.log('1. Supabase pg_cron scheduler (if configured)');
  console.log('2. External cron service calling the daily-cron endpoint');
  console.log('3. Manual triggering of the function');
  
  console.log('\n🔍 RECOMMENDATION:');
  console.log('Check if there is an external cron service (like GitHub Actions, Vercel Cron, or similar)');
  console.log('that calls https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron every day at 7 AM EST');
}

checkCronSetup();