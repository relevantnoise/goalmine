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
    console.log('[SELF-SCHEDULE] Self-scheduling email system activated');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current Eastern time
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const [hour, minute] = easternTime.split(':').map(Number);
    const todayDate = now.toISOString().split('T')[0];
    
    console.log(`[SELF-SCHEDULE] Current Eastern Time: ${hour}:${minute.toString().padStart(2, '0')}`);
    
    // Check if we've already sent emails today
    const { data: sentToday, error: checkError } = await supabase
      .from('goals')
      .select('last_motivation_date')
      .eq('last_motivation_date', todayDate)
      .limit(1);
      
    const alreadySentToday = !checkError && sentToday && sentToday.length > 0;
    
    // Send emails if:
    // 1. It's 7 AM Eastern (7:00-7:59 AM window)
    // 2. We haven't sent emails today yet
    const isEmailTime = hour === 7;
    const shouldSendEmails = isEmailTime && !alreadySentToday;
    
    console.log(`[SELF-SCHEDULE] Is email time (7 AM ET): ${isEmailTime}`);
    console.log(`[SELF-SCHEDULE] Already sent today: ${alreadySentToday}`);
    console.log(`[SELF-SCHEDULE] Should send emails: ${shouldSendEmails}`);

    if (shouldSendEmails) {
      console.log('[SELF-SCHEDULE] Sending daily emails now');
      
      // Call the daily-cron function
      const emailResponse = await supabase.functions.invoke('daily-cron', {
        body: {},
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      });

      if (emailResponse.error) {
        console.error('[SELF-SCHEDULE] Error calling daily-cron:', emailResponse.error);
        throw new Error(emailResponse.error.message);
      }

      const result = emailResponse.data;
      console.log('[SELF-SCHEDULE] Daily emails sent successfully:', result);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'EMAILS_SENT',
          message: 'Daily emails sent at 7 AM Eastern',
          time: `${hour}:${minute.toString().padStart(2, '0')} ET`,
          date: todayDate,
          results: result,
          emailsSent: result.totalEmailsSent || 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } else {
      // Schedule next check
      const status = alreadySentToday ? 'EMAILS_ALREADY_SENT_TODAY' : 
                   isEmailTime ? 'WAITING_IN_EMAIL_WINDOW' : 'WAITING_FOR_EMAIL_TIME';
      
      return new Response(
        JSON.stringify({
          success: true,
          action: status,
          message: alreadySentToday ? 
            'Emails already sent today' : 
            isEmailTime ? 'In email window but already processed' : 'Monitoring for 7 AM Eastern',
          currentTime: `${hour}:${minute.toString().padStart(2, '0')} ET`,
          nextEmailTime: '7:00 AM ET tomorrow',
          alreadySentToday,
          status: 'monitoring'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error('[SELF-SCHEDULE] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        action: 'ERROR'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);