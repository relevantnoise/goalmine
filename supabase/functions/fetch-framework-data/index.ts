import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      throw new Error('Missing required field: userEmail');
    }

    console.log('[FETCH-FRAMEWORK] Fetching framework data for user:', userEmail);

    // Get Firebase UID from profile (following hybrid architecture)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({
        success: true,
        hasFramework: false,
        message: 'No user profile found'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const userId = profile.id;
    console.log('[FETCH-FRAMEWORK] Using Firebase UID:', userId);

    // FIXED: Check for assessment data directly instead of requiring user_frameworks entry
    // First try to get user_frameworks entry
    const { data: framework, error: frameworkError } = await supabase
      .from('user_frameworks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no user_frameworks entry, check if assessment data exists directly
    if (frameworkError?.code === 'PGRST116') {
      console.log('[FETCH-FRAMEWORK] No user_frameworks entry, checking for assessment data directly...');
      
      // Check if pillar assessment data exists for this user
      const { data: directPillars, error: pillarsError } = await supabase
        .from('pillar_assessments')
        .select('framework_id')
        .eq('user_email', userEmail)
        .limit(1);
      
      if (pillarsError || !directPillars || directPillars.length === 0) {
        console.log('[FETCH-FRAMEWORK] No assessment data found for user');
        return new Response(JSON.stringify({
          success: true,
          hasFramework: false,
          message: 'No assessment data found for user'
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      // Use the framework_id from the pillar assessment
      const frameworkId = directPillars[0].framework_id;
      console.log('[FETCH-FRAMEWORK] Found assessment data with framework_id:', frameworkId);
      
      // Create a mock framework object since user_frameworks entry doesn't exist
      const mockFramework = {
        id: frameworkId,
        user_id: userId,
        user_email: userEmail,
        is_active: true,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        onboarding_completed: true,
        last_checkin_date: null,
        total_checkins: 0
      };
      
      // Continue with this framework data
      console.log('[FETCH-FRAMEWORK] Using mock framework for existing assessment data');
      return await processFrameworkData(mockFramework, userEmail, userId);
    }
    
    if (frameworkError) {
      if (frameworkError.code === '42P01') {
        // Table doesn't exist yet - this is expected for new installations
        console.log('[FETCH-FRAMEWORK] Framework tables do not exist yet - user needs to complete assessment');
        return new Response(JSON.stringify({
          success: true,
          hasFramework: false,
          message: 'Framework tables not created yet - user needs assessment'
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      throw new Error(`Failed to fetch framework: ${frameworkError.message}`);
    }

    console.log('[FETCH-FRAMEWORK] Framework found:', framework.id);
    
    // Process the framework data
    return await processFrameworkData(framework, userEmail, userId);
    
  } catch (error: any) {
    console.error('[FETCH-FRAMEWORK] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      hasFramework: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

// Helper function to process framework data
async function processFrameworkData(framework: any, userEmail: string, userId: string) {
  console.log('[PROCESS-FRAMEWORK] Processing framework:', framework.id);

  const { data: elements, error: elementsError } = await supabase
    .from('pillar_assessments')
    .select('*')
    .eq('framework_id', framework.id)
    .order('pillar_name');

  if (elementsError) {
    throw new Error(`Failed to fetch elements: ${elementsError.message}`);
  }

  console.log('[PROCESS-FRAMEWORK] Elements found:', elements?.length || 0);

  // Get work happiness data
  const { data: workHappiness, error: workError } = await supabase
    .from('work_happiness')
    .select('*')
    .eq('framework_id', framework.id)
    .single();

  if (workError && workError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch work happiness: ${workError.message}`);
  }

  console.log('[PROCESS-FRAMEWORK] Work happiness found:', !!workHappiness);

  // Get AI insights for state detection
  const { data: aiInsights, error: insightsError } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('framework_id', framework.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (insightsError && insightsError.code !== 'PGRST116') {
    console.error('[PROCESS-FRAMEWORK] AI insights error:', insightsError);
  }

  console.log('[PROCESS-FRAMEWORK] AI insights found:', aiInsights?.length || 0);

  // Get user's goals related to framework (hybrid architecture support)
  const { data: frameworkGoals, error: goalsError } = await supabase
    .from('goals')
    .select('id, title, user_id')
    .or(`user_id.eq.${userEmail},user_id.eq.${userId}`)
    .eq('active', true);

  if (goalsError && goalsError.code !== 'PGRST116') {
    console.error('[PROCESS-FRAMEWORK] Goals error:', goalsError);
  }

  console.log('[PROCESS-FRAMEWORK] Active goals found:', frameworkGoals?.length || 0);

  // Transform elements into the format expected by frontend with meaningful insights
  const elementsData = elements?.map(element => {
      const currentHours = element.current_hours_per_week || 0;
      const idealHours = element.ideal_hours_per_week || 0;
      const importance = element.importance_level || 5;
      const timeGap = idealHours - currentHours;
      const timeGapPercentage = idealHours > 0 ? Math.round((timeGap / idealHours) * 100) : 0;
      
      return {
        name: element.pillar_name,
        current: currentHours, // Current time allocation
        desired: idealHours, // Desired time allocation  
        gap: timeGap, // Time gap (hours needed)
        importance: importance, // How important this pillar is to them
        timeGapPercentage, // Percentage under/over allocated
        definition: `${importance}/10 importance • ${currentHours}h current → ${idealHours}h ideal`,
        weeklyHours: currentHours,
        priority: importance,
        id: element.id,
        insight: timeGap > 10 ? 'Severely under-allocated' : 
                timeGap > 5 ? 'Under-allocated' :
                timeGap < -5 ? 'Over-allocated' :
                timeGap < 0 ? 'Slightly over-allocated' : 'Well-balanced'
      };
    }) || [];

    // Create fallback object for empty elements
    const fallbackElement = { 
      name: 'No Data', 
      gap: 0, 
      importance: 1, 
      desired: 1,
      current: 0
    };

    // Find biggest time allocation gap (most under-allocated high-importance pillar)
    const biggestGap = elementsData.length > 0 ? elementsData.reduce((max, element) => {
      const maxScore = (max.gap || 0) * (max.importance || 1);
      const elementScore = (element.gap || 0) * (element.importance || 1);
      return elementScore > maxScore ? element : max;
    }, elementsData[0]) : fallbackElement;

    // Find strongest pillar (best balance of importance vs gap = most aligned with goals)
    const strongestPillar = elementsData.length > 0 ? elementsData.reduce((best, element) => {
      // Calculate alignment score: how well current allocation matches desired state
      const elementAlignment = (element.importance || 1) * (1 - Math.abs(element.gap || 0) / Math.max(element.desired || 1, 1));
      const bestAlignment = (best.importance || 1) * (1 - Math.abs(best.gap || 0) / Math.max(best.desired || 1, 1));
      return elementAlignment > bestAlignment ? element : best;
    }, elementsData[0]) : fallbackElement;

    // Calculate meaningful metrics
    const totalCurrentHours = elementsData.reduce((sum, el) => sum + (el.current || 0), 0);
    const totalDesiredHours = elementsData.reduce((sum, el) => sum + (el.desired || 0), 0);
    
    // Simple math: 168 hours total in a week
    const totalWeeklyHours = 168;
    const availableTime = totalWeeklyHours - totalDesiredHours;
    const isOverAllocated = totalDesiredHours > totalWeeklyHours;
    
    // Calculate reallocation needed (how much time needs to shift between pillars)
    const timeToReallocate = elementsData.reduce((sum, el) => sum + Math.max(0, el.gap || 0), 0);
    const averageImportance = elementsData.length > 0 ? 
      Math.round(elementsData.reduce((sum, el) => sum + (el.importance || 0), 0) / elementsData.length * 10) / 10 : 0;
    
    // High-importance pillars that are under-allocated
    const priorityMismatches = elementsData.filter(el => 
      (el.importance || 0) >= 8 && (el.gap || 0) > 5
    ).length;

    // Intelligent state detection
    const hasActiveInsights = aiInsights && aiInsights.length > 0;
    const hasActiveGoals = frameworkGoals && frameworkGoals.length > 0;
    
    let assessmentState = 'completed'; // Default: framework exists
    
    if (hasActiveGoals || framework.total_checkins > 0) {
      assessmentState = 'ongoing'; // Has goals or check-ins = ongoing management
    } else if (hasActiveInsights) {
      assessmentState = 'insights'; // Has insights but no goals yet
    }
    
    console.log('[FETCH-FRAMEWORK] Assessment state determined:', assessmentState, {
      hasActiveInsights,
      hasActiveGoals,
      totalCheckins: framework.total_checkins
    });

    const result = {
      success: true,
      hasFramework: true,
      message: 'Framework data retrieved successfully',
      data: {
        framework: {
          id: framework.id,
          userId,
          userEmail,
          createdAt: framework.created_at,
          lastUpdated: framework.last_updated,
          onboardingCompleted: framework.onboarding_completed,
          lastCheckinDate: framework.last_checkin_date,
          totalCheckins: framework.total_checkins
        },
        elements: elementsData,
        workHappiness: workHappiness ? {
          impactCurrent: workHappiness.impact_current,
          impactDesired: workHappiness.impact_desired,
          funCurrent: workHappiness.enjoyment_current,
          funDesired: workHappiness.enjoyment_desired,
          moneyCurrent: workHappiness.income_current,
          moneyDesired: workHappiness.income_desired,
          remoteCurrent: workHappiness.remote_current,
          remoteDesired: workHappiness.remote_desired,
          id: workHappiness.id
        } : null,
        insights: {
          biggestGap: biggestGap.name,
          biggestGapValue: biggestGap.gap,
          biggestGapImportance: biggestGap.importance,
          strongestPillar: strongestPillar.name,
          strongestPillarBalance: Math.abs(strongestPillar.gap || 0),
          totalCurrentHours,
          totalDesiredHours, 
          availableTime,
          timeToReallocate,
          averageImportance,
          priorityMismatches,
          timeAllocationInsight: isOverAllocated ? 
            `Over-allocated: Want ${totalDesiredHours}h but only 168h available weekly` :
            availableTime > 0 ? `Great planning: ${availableTime}h available to allocate` :
            'Perfectly allocated: Using all 168 hours weekly',
          workHappinessGaps: workHappiness ? {
            impactGap: (workHappiness.impact_current || 0) - (workHappiness.impact_desired || 0),
            funGap: (workHappiness.enjoyment_current || 0) - (workHappiness.enjoyment_desired || 0),
            moneyGap: (workHappiness.income_current || 0) - (workHappiness.income_desired || 0),
            flexibilityGap: (workHappiness.remote_current || 0) - (workHappiness.remote_desired || 0)
          } : null,
          workHappinessOpportunity: workHappiness ? {
            message: 'Increase meaningful work impact',
            description: 'Focus on high-impact work opportunities'
          } : null,
          overallProgress: priorityMismatches > 2 ? 'major_realignment_needed' :
                          timeToReallocate > 15 ? 'moderate_changes_needed' : 'minor_adjustments_needed'
        },
        assessmentState,
        aiInsights: aiInsights || [],
        activeGoals: frameworkGoals || [],
        stateInfo: {
          hasActiveInsights,
          hasActiveGoals,
          totalCheckins: framework.total_checkins,
          lastCheckinDate: framework.last_checkin_date
        }
      }
    };

  console.log('[PROCESS-FRAMEWORK] Success:', result.data.insights);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

serve(handler);