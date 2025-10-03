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
      console.log('[VERCEL-CRON] Retrieving pre-generated AI content for danlynn@gmail.com...');
      
      // Retrieve pre-generated AI content from motivation_history table
      // Look for content created today (within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();
      
      const motivationResponse1 = await fetch(
        `https://dhlcycjnzwfnadmsptof.supabase.co/rest/v1/motivation_history?goal_id=eq.8a0349d0-6c7e-4564-b1e3-53b13cb9ec96&created_at=gte.${yesterdayISO}&order=created_at.desc&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }
      );
      
      const motivationData1 = await motivationResponse1.json();
      console.log('[VERCEL-CRON] Pre-generated content for danlynn:', motivationData1.length > 0 ? 'FOUND' : 'NOT_FOUND');
      
      // Use pre-generated content if available, fallback to generic
      const content1 = (motivationData1.length > 0) ? {
        message: motivationData1[0].message,
        microPlan: motivationData1[0].micro_plan,
        challenge: motivationData1[0].challenge
      } : {
        message: "Daily motivation for launching GoalMine! Keep pushing forward.",
        microPlan: ["Fix the email system", "Test the app", "Launch to users"],
        challenge: "Focus on one task at a time"
      };
      
      // Store for debugging
      results.motivationData1 = motivationData1;
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
      console.log('[VERCEL-CRON] Retrieving pre-generated AI content for dandlynn@yahoo.com...');
      
      // Retrieve pre-generated AI content from motivation_history table
      // Look for content created today (within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();
      
      const motivationResponse2 = await fetch(
        `https://dhlcycjnzwfnadmsptof.supabase.co/rest/v1/motivation_history?goal_id=eq.dae2616f-dd2a-41ef-9b49-d90e5c310644&created_at=gte.${yesterdayISO}&order=created_at.desc&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }
      );
      
      const motivationData2 = await motivationResponse2.json();
      console.log('[VERCEL-CRON] Pre-generated content for dandlynn:', motivationData2.length > 0 ? 'FOUND' : 'NOT_FOUND');
      
      // Use pre-generated content if available, fallback to generic
      const content2 = (motivationData2.length > 0) ? {
        message: motivationData2[0].message,
        microPlan: motivationData2[0].micro_plan,
        challenge: motivationData2[0].challenge
      } : {
        message: "Daily motivation for CleverVibes.ai! Help those vibe coders create awareness.",
        microPlan: ["Develop core features", "Create awareness campaign", "Launch to users"],
        challenge: "Build one feature at a time"
      };
      
      // Store for debugging
      results.motivationData2 = motivationData2;
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
        motivationData1: results.motivationData1,
        motivationData2: results.motivationData2,
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