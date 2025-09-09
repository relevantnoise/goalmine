export default async function handler(req, res) {
  // Only allow GET requests from Vercel Cron
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add a secret to prevent unauthorized calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[VERCEL-CRON] Triggering daily email send at', new Date().toISOString());
    
    // Call the Supabase edge function
    // Use SUPABASE_ANON_KEY (without VITE_ prefix) for Vercel serverless functions
    const response = await fetch(
      'https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
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