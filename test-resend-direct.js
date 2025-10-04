// Test Resend directly to see if email delivery works
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

async function testResendDirect() {
  try {
    console.log('📧 Testing Resend email delivery directly...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-motivation-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "danlynn@gmail.com",
        name: "Dan",
        goal: "TEST: Fix the email system once and for all",
        message: "This is a test to see if Resend actually works. We're debugging the month-long email issue.",
        microPlan: ["Check database", "Fix queries", "Send emails"],
        challenge: "Make this email system work!",
        streak: 999,
        redirectUrl: "https://goalmine.ai",
        isNudge: false,
        userId: "test-user",
        goalId: "test-goal"
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.success) {
        console.log('✅ EMAIL SENT SUCCESSFULLY! Resend works fine.');
        console.log('📧 Email ID:', data.id);
        console.log('📧 Check danlynn@gmail.com inbox now!');
      } else {
        console.log('❌ Email failed:', data.error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testResendDirect();