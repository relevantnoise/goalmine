// Test the manual approach with direct API calls to send emails NOW
const SUPABASE_URL = "https://dhlcycjnzwfnadmsptof.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0";

// Known user data from your system
const knownUsers = [
  {
    email: "danlynn@gmail.com",
    goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
    goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
    tone: "drill_sergeant",
    streak: 5,
    userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3"
  },
  {
    email: "dandlynn@yahoo.com", 
    goalTitle: "Launch CleverVibes.ai - an application developed to help create awareness for vibe coders.",
    goalDescription: "I want to launch CleverVibes.ai in order to help all of the innovative vibe coders create awareness of their inventions.",
    tone: "drill_sergeant",
    streak: 4,
    userId: "8MZNQ8sG1VfWaBd74A39jNzyZmL2"
  }
];

async function sendEmailsManuallyNow() {
  try {
    console.log('🚀 MANUAL APPROACH: Sending emails directly via API calls NOW...');

    let emailsSent = 0;
    let errors = 0;

    for (const user of knownUsers) {
      try {
        console.log(`\n📧 Processing: ${user.email} - "${user.goalTitle}"`);
        
        // Generate AI content
        console.log('🤖 Generating AI content...');
        const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-daily-motivation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goalId: null, // Skip database save to avoid UUID errors
            goalTitle: user.goalTitle,
            goalDescription: user.goalDescription,
            tone: user.tone,
            streakCount: user.streak,
            userId: user.userId,
            isNudge: false,
            targetDate: "2025-11-15"
          })
        });

        let motivationContent;
        if (!aiResponse.ok) {
          console.log(`❌ AI generation failed for ${user.email} - Status: ${aiResponse.status}`);
          const errorText = await aiResponse.text();
          console.log(`❌ AI error details: ${errorText}`);
          motivationContent = {
            message: `Today is another opportunity to make progress on your goal: ${user.goalTitle}. Keep building momentum!`,
            microPlan: ['Take one small action toward your goal today', 'Document your progress', 'Reflect on your achievements'],
            challenge: 'Take 30 seconds to visualize achieving this goal.'
          };
        } else {
          const aiData = await aiResponse.json();
          if (aiData.message && aiData.microPlan && aiData.challenge) {
            console.log(`🎉 REAL AI CONTENT generated for ${user.email}!`);
            console.log(`📝 Message preview: ${aiData.message.substring(0, 100)}...`);
            motivationContent = aiData;
          } else {
            console.log(`⚠️ AI generation returned error for ${user.email}, using fallback`);
            motivationContent = {
              message: `Daily motivation for ${user.goalTitle}! Keep pushing forward.`,
              microPlan: ['Focus on your goal', 'Take concrete action', 'Track your progress'],
              challenge: 'Take one small step right now'
            };
          }
        }

        console.log(`📤 Sending email to: ${user.email}`);
        
        // Send email via Resend
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-motivation-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.email.split('@')[0],
            goal: user.goalTitle,
            message: motivationContent.message,
            microPlan: motivationContent.microPlan,
            challenge: motivationContent.challenge,
            streak: user.streak,
            redirectUrl: 'https://goalmine.ai',
            isNudge: false,
            userId: user.userId,
            goalId: `manual-${user.email}-${Date.now()}`
          })
        });

        const emailData = await emailResponse.json();
        
        if (emailResponse.ok && emailData.success) {
          console.log(`✅ EMAIL SENT to ${user.email}! ID: ${emailData.id}`);
          emailsSent++;
        } else {
          console.error(`❌ Email failed for ${user.email}:`, emailData.error);
          errors++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n🎯 FINAL RESULTS:`);
    console.log(`✅ Emails sent: ${emailsSent}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (emailsSent > 0) {
      console.log(`\n🎉 SUCCESS! ${emailsSent} emails were actually sent!`);
      console.log(`📧 Check inboxes: danlynn@gmail.com and dandlynn@yahoo.com`);
    } else {
      console.log(`\n😞 No emails were sent. All ${errors} attempts failed.`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

sendEmailsManuallyNow();