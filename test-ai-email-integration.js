// Test script to verify AI content flows properly into emails
async function testAIEmailIntegration() {
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
  
  console.log('🧪 Testing AI → Email Integration...\n');
  
  // Step 1: Generate AI content
  console.log('Step 1: Generating AI content...');
  const aiResponse = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      goalTitle: 'Write a novel',
      goalDescription: 'Complete first draft of fiction novel',
      tone: 'drill_sergeant',
      streakCount: 12,
      userId: 'test-user',
      isNudge: false,
      targetDate: '2025-12-31'
    })
  });

  const aiData = await aiResponse.json();
  
  if (aiData.error) {
    console.error('❌ AI Generation Failed:', aiData.error);
    return;
  }
  
  console.log('✅ AI Content Generated:');
  console.log('  Message:', aiData.message.substring(0, 80) + '...');
  console.log('  MicroPlan:', aiData.microPlan.length, 'items');
  console.log('  Challenge:', aiData.challenge.substring(0, 50) + '...');
  
  // Step 2: Send email with AI content
  console.log('\nStep 2: Sending email with AI content...');
  const emailResponse = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@goalmine.ai',
      name: 'Test User',
      goal: 'Write a novel',
      message: aiData.message,
      microPlan: aiData.microPlan,
      challenge: aiData.challenge,
      streak: 12,
      redirectUrl: 'https://goalmine.ai',
      isNudge: false,
      userId: 'test-user',
      goalId: 'test-goal'
    })
  });

  const emailData = await emailResponse.json();
  
  if (emailData.success) {
    console.log('✅ Email Sent Successfully! ID:', emailData.id);
    console.log('\n🎉 INTEGRATION TEST PASSED!');
    console.log('Tomorrow\'s emails will use awesome AI-generated content!');
  } else {
    console.error('❌ Email Failed:', emailData.error);
  }
}

testAIEmailIntegration().catch(console.error);