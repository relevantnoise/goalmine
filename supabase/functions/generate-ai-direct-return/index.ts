import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    console.log('[AI-DIRECT-RETURN] Generating AI insights for user:', userEmail);

    // Get user's real framework data directly from database
    console.log('[AI-DIRECT-RETURN] Fetching framework data for user:', userEmail);

    // Get Firebase UID from profile (following hybrid architecture)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    const userId = profile.id;
    console.log('[AI-DIRECT-RETURN] Using Firebase UID:', userId);

    // Get framework (using same logic as fetch-framework-data)
    let framework;
    const { data: primaryFramework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no user_frameworks entry, check if assessment data exists directly
    if (frameworkError?.code === 'PGRST116') {
      console.log('[AI-DIRECT-RETURN] No user_frameworks entry, checking for assessment data directly...');
      
      // Check if pillar assessment data exists for this user
      const { data: directElements, error: directError } = await supabase
        .from('pillar_assessments')
        .select('framework_id')
        .eq('user_email', userEmail)
        .limit(1);

      if (directError || !directElements || directElements.length === 0) {
        throw new Error('No framework or assessment data found for user');
      }

      // Get the framework using the framework_id from assessment data
      const frameworkId = directElements[0].framework_id;
      const { data: directFramework, error: directFrameworkError } = await supabase
        .from('user_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .single();

      if (directFrameworkError || !directFramework) {
        throw new Error('Framework data inconsistent');
      }

      console.log('[AI-DIRECT-RETURN] Using framework from assessment data:', frameworkId);
      framework = directFramework;
    } else if (frameworkError || !primaryFramework) {
      throw new Error('No active framework found for user');
    } else {
      framework = primaryFramework;
    }

    // Get pillar assessments (elements)
    const { data: elements, error: elementsError } = await supabase
      .from('pillar_assessments')
      .select('*')
      .eq('framework_id', framework.id)
      .order('pillar_name');

    if (elementsError) {
      console.error('[AI-DIRECT-RETURN] Elements error:', elementsError);
      throw new Error('Failed to fetch pillar assessments');
    }

    // Get work happiness data
    const { data: workHappiness, error: workError } = await supabase
      .from('work_happiness')
      .select('*')
      .eq('framework_id', framework.id)
      .single();

    console.log('[AI-DIRECT-RETURN] Framework data loaded:', { 
      frameworkId: framework.id, 
      elementsCount: elements?.length || 0, 
      hasWorkHappiness: !!workHappiness 
    });
    
    // Transform real user data into assessment format for AI
    const assessmentData = {
      pillars: elements.map((element: any) => ({
        name: element.pillar_name,
        importance: element.importance_level,
        currentHours: element.current_hours_per_week,
        idealHours: element.ideal_hours_per_week,
        timeGap: (element.ideal_hours_per_week || 0) - (element.current_hours_per_week || 0)
      })),
      workHappiness: workHappiness ? {
        impact: { current: workHappiness.impact_current, desired: workHappiness.impact_desired },
        enjoyment: { current: workHappiness.enjoyment_current, desired: workHappiness.enjoyment_desired },
        income: { current: workHappiness.income_current, desired: workHappiness.income_desired },
        remote: { current: workHappiness.remote_current, desired: workHappiness.remote_desired }
      } : null
    };

    console.log('[AI-DIRECT-RETURN] Real user assessment data prepared:', assessmentData);

    // Generate insights using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are an expert life coach who reads between the lines of assessment data to diagnose real problems and patterns.

Analyze their 6 Pillars Framework AND Business Happiness Formula data. Look for:
- Burnout signals (working 50+ hours but wanting less)
- Cascade effects (work overflow → sleep sacrifice → health neglect)
- Sacrificial patterns (what they're giving up for what)
- Priority mismatches (high importance, low time allocation)
- Unsustainable cycles
- Work satisfaction gaps (impact, enjoyment, income, flexibility)
- Career fulfillment issues (low impact/income scores reveal deeper problems)

BE DIRECT AND HONEST. Call out problems like:
- "Working 60 hours isn't a strength, it's a problem"
- "You're in classic burnout - this isn't about time management, it's about boundaries"
- "You're borrowing from sleep to handle work, creating a vicious cycle"
- "Impact score of 3/10 means you're not doing meaningful work - that's soul-crushing"
- "Income satisfaction of 1/10 suggests you're undervalued or in the wrong role"

Generate EXACTLY 3 insights that READ THEIR SPECIFIC DATA:

[
  {
    "insight_type": "priority_focus",
    "title": "Your [Specific Pillar] Wake-Up Call",
    "content": "Here's what your assessment reveals: [specific hours/gaps]. You're spending X hours but want Y hours. That's Z work days per year missing from something you rated as important. [Diagnose what's probably happening based on their specific pattern]. This isn't about time management - it's about [real problem]. IMMEDIATE RESOURCES: • Book: '[Specific book title]' • Course: '[Specific online course]'"
  },
  {
    "insight_type": "work_happiness_analysis", 
    "title": "Your Business Happiness Formula Diagnosis",
    "content": "Your work satisfaction scores reveal critical issues: Impact [X/10 → Y/10], Income [X/10 → Y/10], Enjoyment [X/10 → Y/10], Flexibility [X/10 → Y/10]. [Analyze the specific gaps and what they mean]. The biggest red flag is [specific lowest score]. This suggests [specific career problem]. IMMEDIATE RESOURCES: • Book: '[Specific to their work situation]' • Podcast: '[Career/business specific recommendation]'"
  },
  {
    "insight_type": "strategic_sequence",
    "title": "The Real Problem & Solution",
    "content": "Here's what your assessment is really telling me: [specific diagnosis]. [Describe cascade effects if present]. The solution isn't optimization - it's [intervention/boundaries/priority reset]. 30-day plan: [specific to their situation]. IMMEDIATE RESOURCES: • Book: '[Specific book for their situation]' • Course: '[Relevant online course]'"
  }
]

USER'S ASSESSMENT DATA:
${JSON.stringify(assessmentData, null, 2)}

Use their ACTUAL NUMBERS from BOTH the 6 Pillars AND Business Happiness Formula. Be specific about:
- Pillar hours, gaps, and patterns  
- Work satisfaction scores (impact, income, enjoyment, flexibility)
- How the two assessments connect (e.g., low work satisfaction + long work hours)
No generic advice - reference their specific numbers!

RESOURCE GUIDELINES:
- Only recommend books, online courses, or podcasts (NO APPS)
- Limit to exactly 2 resources per insight
- Mix resource types: books, courses, podcasts
- Choose well-known, reputable resources`;

    console.log('[AI-DIRECT-RETURN] Calling OpenAI with Enterprise Strategic Intelligence engine...');
    console.log('[AI-DIRECT-RETURN] Assessment data being sent:', JSON.stringify(assessmentData, null, 2));
    console.log('[AI-DIRECT-RETURN] OpenAI API Key exists:', !!openaiApiKey);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert life coach who reads between the lines of assessment data to diagnose real problems and patterns. Be direct and honest about what you see. Call out burnout, unsustainable patterns, and sacrificial behaviors. Focus on their actual numbers and specific situations, not generic advice. Include specific actionable resources like books, courses, and practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.8,
      }),
    });

    console.log('[AI-DIRECT-RETURN] OpenAI response status:', openaiResponse.status);
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[AI-DIRECT-RETURN] OpenAI API error status:', openaiResponse.status);
      console.error('[AI-DIRECT-RETURN] OpenAI API error text:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('[AI-DIRECT-RETURN] OpenAI response received successfully');
    console.log('[AI-DIRECT-RETURN] OpenAI result structure:', Object.keys(openaiResult));

    const aiContent = openaiResult.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the AI response
    let insights;
    try {
      console.log('[AI-DIRECT-RETURN] Raw AI content received:', aiContent);
      insights = JSON.parse(aiContent);
      console.log('[AI-DIRECT-RETURN] Successfully parsed AI insights:', insights.length);
    } catch (parseError) {
      console.error('[AI-DIRECT-RETURN] JSON PARSE ERROR:', parseError);
      console.error('[AI-DIRECT-RETURN] Raw AI content that failed to parse:', aiContent);
      console.error('[AI-DIRECT-RETURN] Content length:', aiContent?.length);
      console.error('[AI-DIRECT-RETURN] Content preview:', aiContent?.substring(0, 200));
      
      // Create data-driven fallback insights based on actual assessment data
      console.log('[AI-DIRECT-RETURN] Generating data-driven fallback insights from assessment data');
      
      // Find biggest pillar gap
      const biggestGap = assessmentData.pillars.reduce((max, pillar) => 
        Math.abs(pillar.timeGap) > Math.abs(max.timeGap) ? pillar : max
      );
      
      // Find work happiness biggest gap
      let workHappinessIssue = null;
      if (assessmentData.workHappiness) {
        const gaps = [
          { area: 'impact', gap: assessmentData.workHappiness.impact.desired - assessmentData.workHappiness.impact.current },
          { area: 'income', gap: assessmentData.workHappiness.income.desired - assessmentData.workHappiness.income.current },
          { area: 'enjoyment', gap: assessmentData.workHappiness.enjoyment.desired - assessmentData.workHappiness.enjoyment.current },
          { area: 'flexibility', gap: assessmentData.workHappiness.remote.desired - assessmentData.workHappiness.remote.current }
        ];
        workHappinessIssue = gaps.reduce((max, gap) => gap.gap > max.gap ? gap : max);
      }
      
      insights = [
        {
          insight_type: "priority_focus",
          title: `Your ${biggestGap.name} Opportunity`,
          content: `Your assessment shows a ${Math.abs(biggestGap.timeGap)}-hour weekly gap in ${biggestGap.name} (${biggestGap.currentHours} current → ${biggestGap.idealHours} ideal). This represents your biggest time allocation opportunity. ${biggestGap.timeGap > 0 ? 'You want to invest more time here, which suggests this area is important to you.' : 'You\'re spending more time than desired, which may indicate overcommitment.'} Consider creating a goal to ${biggestGap.timeGap > 0 ? 'increase' : 'reduce'} your weekly ${biggestGap.name} time by ${Math.abs(biggestGap.timeGap)} hours.`
        },
        {
          insight_type: "work_happiness_analysis",
          title: workHappinessIssue ? `Your Work ${workHappinessIssue.area.charAt(0).toUpperCase() + workHappinessIssue.area.slice(1)} Challenge` : "Your Work Satisfaction Analysis",
          content: workHappinessIssue ? 
            `Your Business Happiness Formula reveals a ${workHappinessIssue.gap}-point gap in work ${workHappinessIssue.area}. This suggests ${workHappinessIssue.area} is a key area for professional improvement. ${workHappinessIssue.area === 'income' ? 'Financial satisfaction is crucial for long-term motivation.' : workHappinessIssue.area === 'impact' ? 'Meaningful work impact drives job satisfaction.' : workHappinessIssue.area === 'flexibility' ? 'Location and schedule flexibility affects work-life balance.' : 'Work enjoyment directly impacts daily motivation.'} Consider setting a goal to improve your work ${workHappinessIssue.area}.` :
            "Your work satisfaction assessment shows opportunities for improvement. Focus on the areas where you rated yourself lowest compared to your desired state."
        },
        {
          insight_type: "strategic_sequence",
          title: "Your Next Steps",
          content: `Based on your assessment data, start with your biggest gap: ${biggestGap.name}. ${workHappinessIssue ? `Additionally, address your work ${workHappinessIssue.area} challenge. ` : ''}Remember that life pillars are interconnected - improving one area often positively impacts others. Set specific, measurable goals rather than vague intentions.`
        }
      ];
    }

    console.log('[AI-DIRECT-RETURN] Generated insights:', insights.length);

    // Store insights in database for persistence
    const insightsToStore = insights.map((insight: any, index: number) => ({
      framework_id: framework.id,
      user_email: userEmail,
      insight_type: insight.insight_type || 'gap_analysis',
      title: insight.title || 'Insight Title',
      description: insight.content || 'Insight content',
      priority: index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low',
      is_read: false
    }));

    // Clear existing insights for this framework and insert new ones (assessment data changed)
    const { error: deleteError } = await supabase
      .from('ai_insights')
      .delete()
      .eq('framework_id', framework.id);

    if (deleteError) {
      console.warn('[AI-DIRECT-RETURN] Warning: Could not clear old insights:', deleteError);
    } else {
      console.log('[AI-DIRECT-RETURN] Cleared existing insights for framework regeneration');
    }

    const { data: storedInsights, error: insertError } = await supabase
      .from('ai_insights')
      .insert(insightsToStore)
      .select();

    if (insertError) {
      console.error('[AI-DIRECT-RETURN] Failed to store insights:', insertError);
      // Continue with formatted insights even if storage fails
    } else {
      console.log('[AI-DIRECT-RETURN] Successfully stored', storedInsights?.length, 'insights');
    }

    // Format insights for frontend response
    const formattedInsights = (storedInsights || insightsToStore).map((insight: any, index: number) => ({
      id: insight.id || `insight-${Date.now()}-${index}`,
      framework_id: framework.id,
      user_email: userEmail,
      insight_type: insight.insight_type || 'gap_analysis',
      title: insight.title || 'Insight Title',
      description: insight.description || insight.content || 'Insight content',
      priority: insight.priority || (index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'),
      is_read: insight.is_read || false,
      created_at: insight.created_at || new Date().toISOString()
    }));

    console.log('[AI-DIRECT-RETURN] Success! Generated', formattedInsights.length, 'insights');

    // Generate dashboard summary directly (inline to avoid JWT issues)
    console.log('[AI-DIRECT-RETURN] Generating dashboard summary...');
    try {
      const summaryPrompt = `Create a concise 200-word dashboard summary from these AI insights:

${formattedInsights.map(insight => `${insight.title}: ${insight.description}`).join('\n\n')}

Extract the 3 most important points into a coherent summary that:
1. Identifies the biggest opportunities 
2. Explains key patterns or problems
3. Provides clear next steps

Keep it conversational and actionable. Focus on what matters most.`;

      const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a life coach creating dashboard summaries. Be concise, actionable, and focused on the most important insights.'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json();
        const dashboardSummary = summaryResult.choices[0]?.message?.content || 'Summary not available';
        
        // Store dashboard summary as a special insight
        await supabase
          .from('ai_insights')
          .insert([{
            framework_id: framework.id,
            user_email: userEmail,
            insight_type: 'dashboard_summary',
            title: 'Your Personalized Strategy',
            description: dashboardSummary,
            priority: 'Critical',
            is_read: false
          }]);
          
        console.log('[AI-DIRECT-RETURN] Dashboard summary generated and stored successfully');
      } else {
        console.error('[AI-DIRECT-RETURN] Dashboard summary generation failed');
      }
    } catch (summaryError) {
      console.error('[AI-DIRECT-RETURN] Failed to generate dashboard summary:', summaryError);
      // Continue without failing the main request
    }

    return new Response(JSON.stringify({
      success: true,
      insights: formattedInsights,
      message: `Generated ${formattedInsights.length} AI insights and dashboard summary`,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[AI-DIRECT-RETURN] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
})