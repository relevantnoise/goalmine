import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [VERCEL-CRON] Starting daily email cron job');
    
    // Call our Supabase daily-cron function
    const response = await fetch('https://dhlcycjnzwfnadmsptof.supabase.co/functions/v1/daily-cron', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    console.log('✅ [VERCEL-CRON] Daily cron completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Daily emails triggered successfully',
      details: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [VERCEL-CRON] Error in daily email cron:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also handle POST requests
export async function POST(request: NextRequest) {
  return GET(request);
}