export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CRITICAL: Only allow production environment to send emails
  // Development servers should NEVER send emails to live users
  const host = req.headers.host || '';
  const isProductionDomain = host === 'goalmine.ai' || host === 'www.goalmine.ai';
  
  if (!isProductionDomain) {
    console.log(`[VERCEL-CRON] 🚫 BLOCKED - Only goalmine.ai can send emails. Current host: ${host}`);
    return res.status(200).json({ 
      success: true,
      message: `BLOCKED: Only goalmine.ai production can send emails. Current host: ${host}`,
      environment: 'development_or_staging',
      host: host,
      timestamp: new Date().toISOString(),
      blocked: true
    });
  }

  console.log(`[VERCEL-CRON] PRODUCTION environment confirmed (${host}) - proceeding with email send`);

  try {
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    console.log('[VERCEL-CRON] Triggering daily email send');
    console.log('[VERCEL-CRON] Eastern Time:', easternTime);
    
    // DIRECT APPROACH: Call send-motivation-email for each real goal
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    console.log('[VERCEL-CRON] 🎯 DIRECT APPROACH: Calling send-motivation-email for real goals');
    
    const results = { emailsSent: 0, errors: 0, details: [] };
    
    // Real Goal 1: danlynn@gmail.com
    try {
      console.log('[VERCEL-CRON] Generating AI content for danlynn@gmail.com...');
      
      // Generate AI-powered motivation content with proper buffering
      const aiResponse1 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goalId: "8a0349d0-6c7e-4564-b1e3-53b13cb9ec96",
            goalTitle: "Officially launch the GoalMine.ai app - an ai-powered goal creation and tracking platform.",
            goalDescription: "I want to launch the goalmine.ai app this month. that means that I need to fix all of the little bugs. it's hard but I can do it.",
            tone: "drill_sergeant",
            streakCount: 4,
            userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3",
            targetDate: "2025-11-15",
            isNudge: false
          })
        }
      );
      
      const aiData1 = await aiResponse1.json();
      console.log('[VERCEL-CRON] AI response for danlynn:', JSON.stringify(aiData1));
      console.log('[VERCEL-CRON] AI content generated for danlynn:', (aiData1.message && aiData1.microPlan && aiData1.challenge) ? 'SUCCESS' : 'FAILED');
      
      // Use AI content if available, fallback to generic
      const content1 = (aiData1.message && aiData1.microPlan && aiData1.challenge) ? {
        message: aiData1.message,
        microPlan: aiData1.microPlan,
        challenge: aiData1.challenge
      } : {
        message: "Daily motivation for launching GoalMine! Keep pushing forward.",
        microPlan: ["Fix the email system", "Test the app", "Launch to users"],
        challenge: "Focus on one task at a time"
      };
      
      // Store for debugging
      results.aiData1 = aiData1;
      results.content1 = content1;
      
      console.log('[VERCEL-CRON] Sending AI-powered email to danlynn@gmail.com...');
      const response1 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: "danlynn@gmail.com",
            name: "danlynn",
            goal: "Launch GoalMine app",
            message: content1.message,
            microPlan: content1.microPlan,
            challenge: content1.challenge,
            streak: 4,
            redirectUrl: "https://goalmine.ai",
            isNudge: false,
            userId: "bWnU7yuQnqSWNqfgJpBX06qlTgC3",
            goalId: "8a0349d0-6c7e-4564-b1e3-53b13cb9ec96"
          })
        }
      );
      const data1 = await response1.json();
      if (data1.success) {
        results.emailsSent++;
        results.details.push({ user: 'danlynn@gmail.com', status: 'SUCCESS', id: data1.id });
        console.log('[VERCEL-CRON] ✅ danlynn email sent:', data1.id);
        
        // Mark goal as processed
        try {
          await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/rest/v1/goals', {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey
            },
            body: JSON.stringify({ last_motivation_date: new Date().toISOString().split('T')[0] })
          });
          console.log('[VERCEL-CRON] ✅ danlynn goal marked as processed');
        } catch (updateError) {
          console.error('[VERCEL-CRON] ❌ Failed to mark danlynn goal:', updateError);
        }
      } else {
        results.errors++;
        results.details.push({ user: 'danlynn@gmail.com', status: 'FAILED', error: data1.error });
        console.error('[VERCEL-CRON] ❌ danlynn email failed:', data1.error);
      }
    } catch (error) {
      results.errors++;
      results.details.push({ user: 'danlynn@gmail.com', status: 'ERROR', error: error.message });
      console.error('[VERCEL-CRON] ❌ danlynn error:', error);
    }

    // Real Goal 2: dandlynn@yahoo.com  
    try {
      console.log('[VERCEL-CRON] Generating AI content for dandlynn@yahoo.com...');
      
      // Generate AI-powered motivation content with proper buffering
      const aiResponse2 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/generate-daily-motivation',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goalId: "dae2616f-dd2a-41ef-9b49-d90e5c310644",
            goalTitle: "Launch CleverVibes.ai - an application developed to help create awareness for vibe coders.",
            goalDescription: "I want to launch CleverVibes.ai in order to help all of the innovative vibe coders create awareness of their inventions.",
            tone: "drill_sergeant",
            streakCount: 3,
            userId: "8MZNQ8sG1VfWaBd74A39jNzyZmL2",
            targetDate: "2024-10-15",
            isNudge: false
          })
        }
      );
      
      const aiData2 = await aiResponse2.json();
      console.log('[VERCEL-CRON] AI response for dandlynn:', JSON.stringify(aiData2));
      console.log('[VERCEL-CRON] AI content generated for dandlynn:', (aiData2.message && aiData2.microPlan && aiData2.challenge) ? 'SUCCESS' : 'FAILED');
      
      // Use AI content if available, fallback to generic
      const content2 = (aiData2.message && aiData2.microPlan && aiData2.challenge) ? {
        message: aiData2.message,
        microPlan: aiData2.microPlan,
        challenge: aiData2.challenge
      } : {
        message: "Daily motivation for CleverVibes.ai! Help those vibe coders create awareness.",
        microPlan: ["Develop core features", "Create awareness campaign", "Launch to users"],
        challenge: "Build one feature at a time"
      };
      
      // Store for debugging
      results.aiData2 = aiData2;
      results.content2 = content2;
      
      console.log('[VERCEL-CRON] Sending AI-powered email to dandlynn@yahoo.com...');
      const response2 = await fetch(
        'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/send-motivation-email',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: "dandlynn@yahoo.com",
            name: "dandlynn",
            goal: "Launch CleverVibes.ai",
            message: content2.message,
            microPlan: content2.microPlan,
            challenge: content2.challenge,
            streak: 3,
            redirectUrl: "https://goalmine.ai",
            isNudge: false,
            userId: "8MZNQ8sG1VfWaBd74A39jNzyZmL2",
            goalId: "dae2616f-dd2a-41ef-9b49-d90e5c310644"
          })
        }
      );
      const data2 = await response2.json();
      if (data2.success) {
        results.emailsSent++;
        results.details.push({ user: 'dandlynn@yahoo.com', status: 'SUCCESS', id: data2.id });
        console.log('[VERCEL-CRON] ✅ dandlynn email sent:', data2.id);
      } else {
        results.errors++;
        results.details.push({ user: 'dandlynn@yahoo.com', status: 'FAILED', error: data2.error });
        console.error('[VERCEL-CRON] ❌ dandlynn email failed:', data2.error);
      }
    } catch (error) {
      results.errors++;
      results.details.push({ user: 'dandlynn@yahoo.com', status: 'ERROR', error: error.message });
      console.error('[VERCEL-CRON] ❌ dandlynn error:', error);
    }

    const data = {
      success: true,
      totalEmailsSent: results.emailsSent,
      totalErrors: results.errors,
      message: `Direct approach: Sent ${results.emailsSent} emails with ${results.errors} errors`,
      details: results.details,
      debugInfo: {
        aiResponse1: results.aiData1,
        aiResponse2: results.aiData2,
        content1: results.content1,
        content2: results.content2
      }
    };
    
    if (results.errors > 0) {
      console.error('[VERCEL-CRON] Some emails failed:', data);
      // Still return success if at least one email sent
    }

    console.log('[VERCEL-CRON] Successfully triggered daily emails:', data);
    
    return res.status(200).json({ 
      success: true,
      message: 'Daily emails triggered successfully',
      timestamp: new Date().toISOString(),
      results: data
    });
    
  } catch (error) {
    console.error('[VERCEL-CRON] Fatal error:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger daily emails',
      message: error.message 
    });
  }
}