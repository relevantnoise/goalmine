export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CRITICAL FIX: Only allow production environment to send emails
  // Development environment URLs contain 'steady-aim-coach'
  // Production environment uses 'goalmine.ai'
  const host = req.headers.host || '';
  const isDevelopment = host.includes('steady-aim-coach');
  
  if (isDevelopment) {
    console.log(`[VERCEL-CRON] SKIPPED - Development environment detected (${host})`);
    return res.status(200).json({ 
      success: true,
      message: 'Skipped: Development environment does not send emails',
      environment: 'development',
      host: host,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`[VERCEL-CRON] PRODUCTION environment confirmed (${host}) - proceeding with email send`);

  // Optional: Add a secret to prevent unauthorized calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const utcTime = now.toISOString();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Enhanced timezone debugging
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const easternDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const easternHour = easternDate.getHours();
    const easternMinute = easternDate.getMinutes();
    
    console.log('[VERCEL-CRON] Triggering daily email send');
    console.log('[VERCEL-CRON] ========== TIMEZONE DEBUG ==========');
    console.log('[VERCEL-CRON] Full UTC Time:', utcTime);
    console.log('[VERCEL-CRON] UTC Hour:Minute:', `${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')}`);
    console.log('[VERCEL-CRON] Full Eastern Time:', easternTime);
    console.log('[VERCEL-CRON] Eastern Hour:Minute:', `${easternHour.toString().padStart(2, '0')}:${easternMinute.toString().padStart(2, '0')}`);
    console.log('[VERCEL-CRON] Expected: 11:00 UTC = 07:00 EDT');
    console.log('[VERCEL-CRON] Actual execution time check:', utcHour === 11 ? 'CORRECT' : `WRONG - executing at ${utcHour}:${utcMinute.toString().padStart(2, '0')} UTC instead of 11:00 UTC`);
    console.log('[VERCEL-CRON] =====================================');
    
    // Call the Supabase edge function
    // Hardcoded temporarily - need to add SUPABASE_ANON_KEY to Vercel env vars
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobGN5Y2puendmbmFkbXNwdG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTAzNzUsImV4cCI6MjA3MDc2NjM3NX0.UA1bHJVLG6uqL4xtjlkRRjn3GWyid6D7DGN9XIhTcQ0';
    
    const response = await fetch(
      'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[VERCEL-CRON] Error from Supabase:', data);
      return res.status(500).json({ 
        error: 'Failed to trigger daily emails',
        details: data 
      });
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