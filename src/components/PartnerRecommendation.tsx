import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Target, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  description: string;
  website_url: string;
  affiliate_url: string;
  cta_text: string;
  keywords: string[];
  pillar_categories: string[];
  is_active: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  pillar_type: string;
}

interface PartnerRecommendationProps {
  goal: Goal;
}

export const PartnerRecommendation = ({ goal }: PartnerRecommendationProps) => {
  console.log('🚀 PartnerRecommendation component mounted with goal:', goal.title);
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find matching partner for this goal
  useEffect(() => {
    if (goal?.id) {
      findPartnerForGoal();
    }
  }, [goal.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const findPartnerForGoal = async () => {
    try {
      console.log('🔍 PartnerRecommendation: Starting partner search for goal:', goal.title);
      console.log('🔍 PartnerRecommendation: Goal pillar type:', goal.pillar_type);
      setLoading(true);
      
      // Get active partners that match the goal's pillar category
      const { data: partners, error } = await supabase
        .from('strategic_partners')
        .select('*')
        .eq('is_active', true)
        .contains('pillar_categories', [goal.pillar_type]);
      
      if (error) {
        console.error('🚨 Partner query error:', error);
        return;
      }
      
      console.log('🔍 PartnerRecommendation: Found partners:', partners);
      
      if (!partners || partners.length === 0) {
        console.log(`🚨 No partners found for pillar: ${goal.pillar_type}`);
        return;
      }
      
      // Find partner with matching keywords in goal text
      const goalText = `${goal.title} ${goal.description || ''}`.toLowerCase();
      
      const matchingPartner = partners.find(partner =>
        partner.keywords.some(keyword => 
          goalText.includes(keyword.toLowerCase())
        )
      );
      
      if (matchingPartner) {
        console.log(`Partner match found: ${matchingPartner.name} for goal "${goal.title}"`);
        setPartner(matchingPartner);
      } else {
        console.log(`No keyword matches found for goal: "${goal.title}"`);
      }
      
    } catch (error) {
      console.error('Partner matching error:', error);
      // Fail silently to avoid breaking goal functionality
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerClick = async () => {
    if (!partner || !user || clicked) return;
    
    setClicked(true);
    
    try {
      // Track the click
      await supabase.from('partner_clicks').insert({
        user_email: user.email,
        goal_id: goal.id,
        partner_id: partner.id,
        goal_title: goal.title,
        user_tier: subscription?.subscription_tier || 'free'
      });
      
      console.log(`Partner click tracked: ${partner.name} for goal "${goal.title}"`);
      
    } catch (error) {
      console.error('Click tracking error:', error);
      // Continue anyway - don't block user experience
    }
    
    // Open partner link with user email substitution
    const url = partner.affiliate_url.replace('{{USER_EMAIL}}', encodeURIComponent(user.email || ''));
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Reset clicked state after 3 seconds to allow re-clicking
    timeoutRef.current = setTimeout(() => {
      setClicked(false);
    }, 3000);
  };

  // Don't render if no partner match, still loading, or no goal
  if (!partner || loading || !goal.id) {
    console.log('🚫 PartnerRecommendation: Not rendering because:', { 
      hasPartner: !!partner, 
      loading, 
      hasGoalId: !!goal.id 
    });
    return null;
  }
  
  console.log('✅ PartnerRecommendation: Rendering partner:', partner.name);

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Recommended Resource</span>
          </div>
          
          <h4 className="font-semibold text-gray-900 mb-1">{partner.name}</h4>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {partner.description}
          </p>
          
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>GoalMine strategic partner</span>
            <span>•</span>
            <span>Based on your goal keywords</span>
          </div>
        </div>
        
        <Button 
          onClick={handlePartnerClick}
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shrink-0"
          disabled={clicked}
        >
          {clicked ? 'Opening...' : partner.cta_text}
          {!clicked && <ExternalLink className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
};