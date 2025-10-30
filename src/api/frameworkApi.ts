import { supabase } from '@/integrations/supabase/client';

export interface FrameworkElement {
  name: string;
  current: number;
  desired: number;
  definition: string;
  weeklyHours: number;
  priority: number;
  gap?: number; // Calculated field
  id?: string; // Database ID
}

export interface WorkHappiness {
  impactCurrent: number;
  impactDesired: number;
  funCurrent: number;
  funDesired: number;
  moneyCurrent: number;
  moneyDesired: number;
  remoteCurrent: number;
  remoteDesired: number;
}

export interface WeeklyCheckinData {
  user_id: string;
  week_ending: string;
  element_scores: Record<string, number>;
  overall_satisfaction: number;
  notes?: string;
}

/**
 * Update framework data (elements and work happiness)
 */
export const updateFrameworkData = async (
  userEmail: string,
  frameworkId: string,
  elements?: FrameworkElement[],
  workHappiness?: WorkHappiness
) => {
  const { data, error } = await supabase.functions.invoke('update-framework-data', {
    body: {
      userEmail,
      frameworkId,
      elements,
      workHappiness
    }
  });

  if (error) {
    console.error('[frameworkApi] Update framework error:', error);
    throw new Error(error.message || 'Failed to update framework data');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to update framework data');
  }

  return data;
};

/**
 * Save weekly check-in data
 */
export const saveWeeklyCheckin = async (checkinData: WeeklyCheckinData) => {
  const { data, error } = await supabase.functions.invoke('save-weekly-checkin', {
    body: checkinData
  });

  if (error) {
    console.error('[frameworkApi] Save checkin error:', error);
    throw new Error(error.message || 'Failed to save weekly check-in');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to save weekly check-in');
  }

  return data;
};

/**
 * Generate and save AI insights for a framework
 */
export const generateAIInsights = async (
  userEmail: string,
  frameworkId: string
) => {
  const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
    body: {
      userEmail,
      frameworkId
    }
  });

  if (error) {
    console.error('[frameworkApi] Generate insights error:', error);
    throw new Error(error.message || 'Failed to generate AI insights');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate AI insights');
  }

  return data;
};

/**
 * Get this week's ending date (Sunday)
 */
export const getWeekEndingDate = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  const weekEnding = new Date(today);
  weekEnding.setDate(today.getDate() + daysUntilSunday);
  
  return weekEnding.toISOString().split('T')[0]; // YYYY-MM-DD format
};