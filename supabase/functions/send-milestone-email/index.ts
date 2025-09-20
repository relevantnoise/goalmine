import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MilestoneEmailRequest {
  email: string;
  name: string;
  goal: string;
  milestoneLabel: string;
  nextStep: string;
  streak: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, goal, milestoneLabel, nextStep, streak }: MilestoneEmailRequest = await req.json();

    console.log('Sending milestone email to:', email);

    const emailResponse = await resend.emails.send({
      from: "GoalMine.ai <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 Milestone Achieved: ${milestoneLabel} on ${goal}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6c47ff; font-size: 32px; margin-bottom: 10px;">🎯 GoalMine.ai</h1>
            <p style="color: #666; font-size: 16px;">Celebrating your incredible milestone!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #6c47ff, #9333ea); color: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: white; font-size: 28px; margin-bottom: 15px;">🏆 Congratulations!</h2>
            <p style="color: #e0e7ff; font-size: 20px; line-height: 1.4; margin-bottom: 10px;">
              You've reached your <strong>${milestoneLabel}</strong>
            </p>
            <p style="color: #e0e7ff; font-size: 18px; margin-bottom: 0;">
              on your goal: <strong>"${goal}"</strong>
            </p>
          </div>

          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h3 style="color: #16a34a; font-size: 20px; margin-bottom: 15px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">🚀</span> Keep The Momentum Going
            </h3>
            <p style="color: #333; font-size: 17px; line-height: 1.6; font-weight: 500;">
              ${nextStep}
            </p>
          </div>

          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <h3 style="color: #d97706; font-size: 18px; margin-bottom: 10px;">Your Current Streak</h3>
            <div style="font-size: 36px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">
              ${streak} Days
            </div>
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              You're building something incredible!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
              Ready to keep your incredible streak going? 🔥
            </p>
            <a href="https://id-preview--d29859bd-6b5c-4f96-8c57-38eeb3739c83.lovable.app" 
               style="background: #6c47ff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue Your Journey
            </a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              GoalMine.ai - Your personal goal achievement companion<br>
              <a href="#" style="color: #999;">Unsubscribe</a> | <a href="#" style="color: #999;">Update preferences</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Milestone email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-milestone-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);