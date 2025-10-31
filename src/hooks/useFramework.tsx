import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

console.log('🔥 useFramework.tsx file loaded at:', new Date().toISOString());

interface FrameworkElement {
  name: string;
  current: number;
  desired: number;
  gap: number;
  definition: string;
  weeklyHours: number;
  priority: number;
  id: string;
}

interface WorkHappiness {
  impactCurrent: number;
  impactDesired: number;
  funCurrent: number;
  funDesired: number;
  moneyCurrent: number;
  moneyDesired: number;
  remoteCurrent: number;
  remoteDesired: number;
  id: string;
}

interface FrameworkInsights {
  biggestGap: string;
  biggestGapValue: number;
  averageCurrent: number;
  averageDesired: number;
  totalGap: number;
  overallProgress: 'needs_improvement' | 'on_track';
  elementsNeedingAttention: number;
}

interface Framework {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  lastUpdated: string;
  onboardingCompleted: boolean;
  lastCheckinDate: string | null;
  totalCheckins: number;
}

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  priority: number;
  is_read: boolean;
  created_at: string;
}

interface ActiveGoal {
  id: string;
  title: string;
  user_id: string;
}

interface StateInfo {
  hasActiveInsights: boolean;
  hasActiveGoals: boolean;
  totalCheckins: number;
  lastCheckinDate: string | null;
}

interface FrameworkData {
  framework?: Framework;
  elements?: FrameworkElement[];
  workHappiness?: WorkHappiness | null;
  insights?: FrameworkInsights;
  assessmentState?: 'initial' | 'completed' | 'insights' | 'ongoing';
  aiInsights?: AIInsight[];
  activeGoals?: ActiveGoal[];
  stateInfo?: StateInfo;
}

export interface UseFrameworkReturn {
  frameworkData: FrameworkData | null;
  hasFramework: boolean;
  assessmentState: 'initial' | 'completed' | 'insights' | 'ongoing';
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFramework = (): UseFrameworkReturn => {
  const { user } = useAuth();
  const [frameworkData, setFrameworkData] = useState<FrameworkData | null>(null);
  const [hasFramework, setHasFramework] = useState(false);
  const [assessmentState, setAssessmentState] = useState<'initial' | 'completed' | 'insights' | 'ongoing'>('initial');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🆕 [useFramework TOTALLY NEW VERSION] Hook initialized with user:', user?.email || 'no user');

  const fetchFrameworkData = async () => {
    console.log('🆕 [useFramework NEW] fetchFrameworkData called with user:', user?.email);
    if (!user?.email) {
      console.log('🆕 [useFramework NEW] No user email, setting loading false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🆕 [useFramework NEW] Checking AI insights using hybrid architecture for:', user.email);
      console.log('🆕 [useFramework NEW] User object:', { email: user.email, uid: user.uid, id: user.id, firebaseUID: user.firebaseUID });
      
      // Get the Firebase UID - check multiple possible property names
      const firebaseUID = user.uid || user.id || user.firebaseUID;

      // HYBRID ARCHITECTURE: Check both email and user_email columns
      // Try framework_id as email (might be stored as UUID or email)
      console.log('🔍 [useFramework] Querying ai_insights by user_email...');
      const { data: frameworkInsights, error: frameworkError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_email', user.email) // Use user_email column instead of framework_id
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('🔍 [useFramework] Email query result:', { 
        insights: frameworkInsights?.length || 0, 
        error: frameworkError?.message || 'none' 
      });

      // Skip Firebase UID query for now due to UUID type mismatch
      // The ai_insights table framework_id column expects UUID format
      // but Firebase UID is a string format - this causes the 400 error
      let uidInsights = [];
      let uidError = null;
      console.log('🔍 [useFramework] Skipping Firebase UID query due to UUID type mismatch');

      // Combine results from both queries
      const insights = [...(frameworkInsights || []), ...(uidInsights || [])];
      console.log('🔍 [useFramework] Combined insights total:', insights.length);

      console.log('🆕 [useFramework NEW] User email insights:', frameworkInsights?.length || 0);
      console.log('🆕 [useFramework NEW] UID insights:', uidInsights?.length || 0);
      
      if (frameworkError && frameworkError.code !== 'PGRST116') {
        console.warn('🆕 [useFramework NEW] Framework insights error:', frameworkError);
      }
      if (uidError && uidError.code !== 'PGRST116') {
        console.warn('🆕 [useFramework NEW] UID insights error:', uidError);
      }

      console.log('🆕 [useFramework NEW] AI insights found:', insights?.length || 0);
      if (insights && insights.length > 0) {
        console.log('🆕 [useFramework NEW] Sample insight structure:', insights[0]);
        console.log('🆕 [useFramework NEW] All insights:', insights);
      }

      if (insights && insights.length > 0) {
        // AI insights exist - framework is complete, but we need full framework data too
        console.log('✅ [useFramework NEW] Found AI insights, fetching full framework data...');
        
        try {
          const { data: frameworkCheck } = await supabase.functions.invoke('fetch-framework-data', {
            body: { userEmail: user.email }
          });
          
          const fullFrameworkData = frameworkCheck?.data;
          
          if (fullFrameworkData) {
            // Combine AI insights with framework data
            setFrameworkData({ 
              ...fullFrameworkData,
              aiInsights: insights 
            });
            setHasFramework(true);
            setAssessmentState('insights');
            console.log('✅ [useFramework NEW] Framework complete with AI insights and full data');
          } else {
            // Fallback to just insights if framework data fetch fails
            setFrameworkData({ aiInsights: insights });
            setHasFramework(true);
            setAssessmentState('insights');
            console.log('⚠️ [useFramework NEW] Using insights only, framework data fetch failed');
          }
        } catch (fetchError) {
          console.error('🔍 [useFramework] Framework data fetch failed:', fetchError);
          // Fallback to just insights
          setFrameworkData({ aiInsights: insights });
          setHasFramework(true);
          setAssessmentState('insights');
          console.log('⚠️ [useFramework NEW] Using insights only due to fetch error');
        }
      } else {
        // No AI insights found - check if assessment framework exists
        console.log('⚠️ [useFramework NEW] No AI insights found, checking for completed assessment...');
        
        // Check if user has completed the assessment by looking for framework data
        // Use edge function to avoid RLS policy issues
        console.log('🔍 [useFramework] Checking for framework via edge function...');
        try {
          const { data: frameworkCheck } = await supabase.functions.invoke('fetch-framework-data', {
            body: { userEmail: user.email }
          });
          
          console.log('🔍 [useFramework] Full framework response:', frameworkCheck);
          
          // Fix: Use the correct path to framework data
          const userFramework = frameworkCheck?.data?.framework;
          const hasFramework = frameworkCheck?.hasFramework;
          const fullFrameworkData = frameworkCheck?.data;
          
          console.log('🔍 [useFramework] Framework check result via edge function:', hasFramework);
          console.log('🔍 [useFramework] Framework data:', userFramework);
          console.log('🔍 [useFramework] Full data:', fullFrameworkData);
        
          if (hasFramework && userFramework) {
            // Assessment completed - set full framework data including elements, insights, etc.
            console.log('✅ [useFramework NEW] Assessment completed, setting full framework data');
            setFrameworkData(fullFrameworkData);
            setHasFramework(true);
            setAssessmentState(fullFrameworkData.assessmentState || 'completed');
          } else {
            // No assessment found - new user
            console.log('ℹ️ [useFramework NEW] No assessment found, showing initial state');
            setFrameworkData(null);
            setHasFramework(false);
            setAssessmentState('initial');
          }
        } catch (frameworkError) {
          console.error('🔍 [useFramework] Framework check failed:', frameworkError);
          // Default to initial state if framework check fails
          console.log('ℹ️ [useFramework NEW] Framework check failed, defaulting to initial state');
          setFrameworkData(null);
          setHasFramework(false);
          setAssessmentState('initial');
        }
      }

    } catch (err: any) {
      console.error('🆕 [useFramework NEW] Error:', err);
      console.log('🆕 [useFramework NEW] Defaulting to initial state for new user experience');
      // For new users or when framework tables don't exist, default to initial state
      setError(null); // Don't show error to user - this is expected for new users
      setFrameworkData(null);
      setHasFramework(false);
      setAssessmentState('initial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworkData();
  }, [user?.email]);

  const refetch = () => {
    fetchFrameworkData();
  };

  return {
    frameworkData,
    hasFramework,
    assessmentState,
    loading,
    error,
    refetch
  };
};