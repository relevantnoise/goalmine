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
      console.log('🔍 Checking for existing circle framework for:', user.email);
      
      const { data, error } = await supabase
        .from('user_circle_frameworks')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching framework:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Found existing framework:', data.id);
        setFramework(data);
        setHasFramework(true);
        
        // Fetch additional data for full framework
        await fetchFullFrameworkData(data);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchFullFrameworkData = async (frameworkData: CircleFramework) => {
    try {
      // Fetch circle allocations
      const { data: allocations, error: allocError } = await supabase
        .from('circle_time_allocations')
        .select('*')
        .eq('framework_id', frameworkData.id);

      if (allocError) {
        console.error('❌ Error fetching allocations:', allocError);
        throw allocError;
      }

      // Fetch work happiness metrics
      const { data: workHappiness, error: happinessError } = await supabase
        .from('work_happiness_metrics')
        .select('*')
        .eq('framework_id', frameworkData.id)
        .maybeSingle();

      if (happinessError && happinessError.code !== 'PGRST116') {
        console.error('❌ Error fetching work happiness:', happinessError);
        throw happinessError;
      }

      setFullData({
        framework: frameworkData,
        allocations: allocations || [],
        workHappiness: workHappiness || null
      });

      console.log('✅ Full framework data loaded');
    } catch (error) {
      console.error('❌ Error fetching full framework data:', error);
      setFullData(null);
    }
  };

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