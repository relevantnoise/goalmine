import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Target, Zap, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserCount } from "@/components/UserCount";
import { supabase } from "@/integrations/supabase/client";
interface LandingPageProps {
  onGetStarted: () => void;
  onSeePricing: () => void;
  onGoToDashboard?: () => void;
}
export const LandingPage = ({
  onGetStarted,
  onSeePricing,
  onGoToDashboard
}: LandingPageProps) => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  // Use standard supabase client with native auth

  const handleContinueToDashboard = async () => {
    if (!user) return;
    
    console.log('🚀 Continue to Dashboard button clicked!', { user: !!user, userId: user?.id });
    
    // Call the parent's dashboard handler instead of reloading the page
    if (onGoToDashboard) {
      onGoToDashboard();
    }
  };
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={() => window.location.href = '/?home=true'} />

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
              <span className="text-blue-500 font-semibold">Goal</span><span className="text-foreground">Mine.ai</span>
              {/* DEPLOYMENT TEST: Oct 1 2025 - Testing if changes reach live site */}
            </h1>
            
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              <span className="text-primary">Unearth your full potential</span><br />
              with AI-powered motivation
            </h2>
            
            <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed font-normal">Turn your ambitions into action with a personalized, AI-powered daily goal tracker & motivator that's as committed to your success as you are.</p>
            
            <div className="flex justify-center mb-12">
              <UserCount variant="prominent" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            {user ? <Button onClick={handleContinueToDashboard} size="lg" className="bg-primary hover:bg-primary-hover text-lg px-8 py-4 h-auto w-64">
                Continue to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button> : <>
                <Button onClick={() => navigate('/auth')} size="lg" className="bg-primary hover:bg-primary-hover text-lg px-8 py-4 h-auto w-48">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={onSeePricing} size="lg" variant="outline" className="text-lg px-8 py-4 h-auto w-48">
                  See Pricing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </>}
          </div>
          
          <p className="text-sm text-muted-foreground">30-day free trial with no credit card required • After the trial it's just $4.99/month for up to 3 goals</p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">
                Personalized Coaching
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Choose your motivation style: Drill Sergeant, Kind & Encouraging, Teammate, or Wise Mentor. Your AI coach adapts to what works for you.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">
                Daily Micro-Plans
              </h3>
              <p className="text-muted-foreground leading-relaxed">Get up to 3 actionable steps every day. Each takes under 5 minutes to complete, making progress feel effortless and achievable.</p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">
                Streak Building
              </h3>
              <p className="text-muted-foreground leading-relaxed">Track your consistency and build momentum. Every day your engagement adds to your streak, creating positive habits that stick.</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};