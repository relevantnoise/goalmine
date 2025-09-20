import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dhlcycjnzwfnadmsptof.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendobmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mjc2MzAsImV4cCI6MjA0ODMwMzYzMH0.yKmLSqjJvx5C3wbKO_bglYQ7MlNr_OP6LkI0vI3BPGU'
);

async function testEmailSystem() {
  console.log('🧪 TESTING EMAIL SYSTEM STEP BY STEP...\n');
  
  // Step 1: Test the motivation generation
  console.log('1. Testing motivation content generation...');
  try {
    const { data: motivationData, error: motivationError } = await supabase.functions.invoke('generate-daily-motivation', {
      body: {
        goalId: 'test-goal-id',
        goalTitle: 'Test Goal',
        goalDescription: 'Testing email system',
        tone: 'kind_encouraging',
        streakCount: 1,
        userId: 'danlynn@gmail.com',
        targetDate: null,
        isNudge: false
      }
    });
    
    if (motivationError) {
      console.log('❌ Motivation generation error:', motivationError);
      return;
    } else {
      console.log('✅ Motivation generated successfully');
      console.log('Sample content:', motivationData?.message?.substring(0, 100) + '...');
    }
    
    // Step 2: Test the email sending
    console.log('\n2. Testing email sending...');
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-motivation-email', {
      body: {
        email: 'danlynn@gmail.com',
        name: 'danlynn',
        goal: 'Test Goal',
        message: motivationData?.message || 'Test motivation message',
        microPlan: motivationData?.microPlan || ['Test step 1', 'Test step 2'],
        challenge: motivationData?.challenge || 'Test challenge',
        streak: 1,
        redirectUrl: 'https://goalmine.ai',
        isNudge: false,
        userId: 'danlynn@gmail.com',
        goalId: 'test-goal-id'
      }
    });
    
    if (emailError) {
      console.log('❌ Email sending error:', emailError);
      
      // Try to get more details
      if (emailError.message.includes('401') || emailError.message.includes('Unauthorized')) {
        console.log('🔍 This looks like a RESEND_API_KEY issue');
      }
      if (emailError.message.includes('500')) {
        console.log('🔍 This looks like a server error in the email function');
      }
    } else {
      console.log('✅ Email sent successfully!');
      console.log('Email details:', emailData);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testEmailSystem();