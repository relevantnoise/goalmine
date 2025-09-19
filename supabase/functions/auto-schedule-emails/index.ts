import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AUTO-SCHEDULE] Creating automatic email scheduling solution');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a simple recurring function that checks every few minutes if emails need to be sent
    // This runs continuously to ensure emails are sent at the right time
    
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const [hour, minute] = easternTime.split(':').map(Number);
    
    // Check if it's 7 AM Eastern Time (7:00-7:05 AM window)
    const isEmailTime = hour === 7 && minute >= 0 && minute <= 5;
    
    console.log(`[AUTO-SCHEDULE] Current Eastern Time: ${hour}:${minute.toString().padStart(2, '0')}`);
    console.log(`[AUTO-SCHEDULE] Is email time (7:00-7:05 AM ET): ${isEmailTime}`);

    if (isEmailTime) {
      console.log('[AUTO-SCHEDULE] Email time detected - triggering daily emails');
      
      // Call the daily-cron function
      const emailResponse = await supabase.functions.invoke('daily-cron', {
        body: {},
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      });

      if (emailResponse.error) {
        console.error('[AUTO-SCHEDULE] Error calling daily-cron:', emailResponse.error);
        throw new Error(emailResponse.error.message);
      }

      const result = emailResponse.data;
      console.log('[AUTO-SCHEDULE] Daily emails sent successfully:', result);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Daily emails sent at 7 AM Eastern',
          time: `${hour}:${minute.toString().padStart(2, '0')} ET`,
          results: result,
          emailsSent: result.totalEmailsSent || 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      // Not email time - just return status
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Monitoring for email time',
          currentTime: `${hour}:${minute.toString().padStart(2, '0')} ET`,
          nextEmailTime: '7:00 AM ET',
          status: 'waiting'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error('[AUTO-SCHEDULE] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);