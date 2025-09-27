// Quick test to reset goals and trigger emails
const testEmailSystem = async () => {
  try {
    console.log('Testing email system after Fix #5 deployment...');
    
    // Test the fixed email function with force delivery
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-daily-emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sbp_92814ac901f3b9a33f69e4019854d307e675d968',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ forceDelivery: true })
    });
    
    const result = await response.json();
    console.log('Email system test result:', result);
    
    if (result.emailsSent > 0) {
      console.log('✅ SUCCESS: Fix #5 working - emails sent!');
    } else if (result.message?.includes('No goals need processing')) {
      console.log('⚠️  All goals already processed today - need to reset dates');
    } else {
      console.log('❌ ISSUE: No emails sent');
    }
    
  } catch (error) {
    console.error('Error testing email system:', error);
  }
};

testEmailSystem();