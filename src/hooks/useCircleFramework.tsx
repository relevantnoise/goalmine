import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface CircleFramework {
  id: string;
  user_email: string;
  work_hours_per_week: number;
  sleep_hours_per_night: number;
  commute_hours_per_week: number;
  available_hours_per_week: number;
  created_at: string;
}

export interface CircleAllocation {
  id?: string;
  framework_id: string;
  circle_name: string;
  importance_level: number;
  current_hours_per_week: number;
  ideal_hours_per_week: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkHappinessMetrics {
  id?: string;
  framework_id: string;
  impact_current: number;
  impact_desired: number;
  fun_current: number;
  fun_desired: number;
  money_current: number;
  money_desired: number;
  remote_current: number;
  remote_desired: number;
  created_at?: string;
  updated_at?: string;
}

export interface FullFrameworkData {
  framework: CircleFramework;
  allocations: CircleAllocation[];
  workHappiness: WorkHappinessMetrics | null;
}

export const useCircleFramework = () => {
  const { user } = useAuth();
  const [framework, setFramework] = useState<CircleFramework | null>(null);
  const [hasFramework, setHasFramework] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [fullData, setFullData] = useState<FullFrameworkData | null>(null);

  const fetchFramework = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching circle framework via edge function for:', user.email);
      
      // Use edge function instead of direct database query (SAME AS GOALS)
      const { data, error } = await supabase.functions.invoke('fetch-six-elements-framework', {
        body: { userEmail: user.email }
      });

      if (error) {
        console.error('❌ Error fetching framework via function:', error);
        throw error;
      }

      if (data?.success && data?.hasFramework) {
        console.log('✅ Found existing framework via edge function:', data.data.frameworkId);
        
        // Convert six elements data to framework format
        const frameworkData = {
          id: data.data.frameworkId,
          user_email: data.data.userEmail,
          work_hours_per_week: data.data.elementsData?.Work?.ideal_hours_per_week || 40,
          sleep_hours_per_night: (data.data.elementsData?.Sleep?.ideal_hours_per_week || 56) / 7,
          commute_hours_per_week: 0,
          available_hours_per_week: 168,
          created_at: data.data.createdAt
        };
        
        setFramework(frameworkData);
        setHasFramework(true);
        
        // Convert elements data to allocations format
        const allocations = Object.entries(data.data.elementsData || {}).map(([name, element]: [string, any]) => ({
          id: element.id,
          framework_id: data.data.frameworkId,
          circle_name: name,
          importance_level: element.importance_level,
          current_hours_per_week: element.current_hours_per_week,
          ideal_hours_per_week: element.ideal_hours_per_week
        }));
        
        // Convert work happiness data
        const workHappiness = data.data.workHappinessData ? {
          id: data.data.workHappinessData.id,
          framework_id: data.data.frameworkId,
          impact_current: data.data.workHappinessData.impact_current,
          impact_desired: data.data.workHappinessData.impact_desired,
          fun_current: data.data.workHappinessData.enjoyment_current,
          fun_desired: data.data.workHappinessData.enjoyment_desired,
          money_current: data.data.workHappinessData.income_current,
          money_desired: data.data.workHappinessData.income_desired,
          remote_current: data.data.workHappinessData.remote_current,
          remote_desired: data.data.workHappinessData.remote_desired
        } : null;
        
        setFullData({
          framework: frameworkData,
          allocations,
          workHappiness
        });
      } else {
        console.log('📝 No framework found - user needs onboarding');
        setFramework(null);
        setHasFramework(false);
        setFullData(null);
      }
    } catch (error) {
      console.error('❌ Framework fetch error:', error);
      setFramework(null);
      setHasFramework(false);
      setFullData(null);
    } finally {
      setLoading(false);
    }
  };

  // Note: fetchFullFrameworkData is no longer needed since edge function returns everything

  useEffect(() => {
    fetchFramework();
  }, [user?.email]);

  const refetchFramework = () => {
    setLoading(true);
    fetchFramework();
  };

  return {
    framework,
    hasFramework,
    loading,
    refetchFramework,
    fullData
  };
};