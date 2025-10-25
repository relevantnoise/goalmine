import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dashboard } from "./Dashboard";
import { FiveCircleDashboard } from "./FiveCircleDashboard";

interface SmartDashboardProps {
  onNudgeMe: () => Promise<any>;
  onStartOver: () => void;
  onLogoClick: () => void;
}

export const SmartDashboard = ({ onNudgeMe, onStartOver, onLogoClick }: SmartDashboardProps) => {
  const { user } = useAuth();
  const [hasFiveCircleFramework, setHasFiveCircleFramework] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      checkForFiveCircleFramework();
    }
  }, [user]);

  const checkForFiveCircleFramework = async () => {
    if (!user?.email) return;
    
    try {
      // First get the user's Firebase UID from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (profileError || !profile) {
        console.error('Error getting user profile:', profileError);
        setHasFiveCircleFramework(false);
        return;
      }
      
      // Now check for 5 Circle Framework using Firebase UID
      const { data, error } = await supabase
        .from('circle_frameworks')
        .select('id')
        .eq('user_id', profile.id)
        .limit(1);

      if (error) {
        console.error('Error checking for 5 Circle Framework:', error);
        setHasFiveCircleFramework(false);
      } else {
        setHasFiveCircleFramework(data && data.length > 0);
      }
    } catch (error) {
      console.error('Error checking for 5 Circle Framework:', error);
      setHasFiveCircleFramework(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Always show 5 Circle Dashboard if framework exists, otherwise traditional
  if (hasFiveCircleFramework) {
    return (
      <FiveCircleDashboard 
        onNudgeMe={onNudgeMe}
        onStartOver={onStartOver}
        onLogoClick={onLogoClick}
      />
    );
  } else {
    return (
      <Dashboard 
        onNudgeMe={onNudgeMe}
        onStartOver={onStartOver}
        onLogoClick={onLogoClick}
      />
    );
  }
};