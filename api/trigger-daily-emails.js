export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow production environment to send emails
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
    
    // Call the Supabase edge function
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