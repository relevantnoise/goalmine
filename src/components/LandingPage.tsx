import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Target, Zap, LogIn, LogOut, Users, Briefcase, BookOpen, Activity, RotateCcw, Moon } from "lucide-react";
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
              <span className="text-primary">Master Life's Complexities</span><br />
              with Two Proven Tools
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed font-normal">
              Ambitious professionals don't need another goal app. You need a <strong>systematic approach</strong> to managing life complexity. 
              GoalMine.ai's proprietary <strong>6 Pillars of Life™ Framework</strong> + <strong>Business Happiness Formula</strong> transform scattered goals into integrated life management.
            </p>

            {/* 6 Pillars Visual - Ordered: Work, Friends & Family, Health & Fitness, Spiritual, Personal Development, Sleep */}
            <div className="flex justify-center items-start mb-8 flex-wrap gap-6">
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-green-800 text-center h-8 flex items-center justify-center">Work</div>
              </div>
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-blue-800 text-center h-8 flex items-center justify-center">Friends &<br />Family</div>
              </div>
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-red-800 text-center h-8 flex items-center justify-center">Health &<br />Fitness</div>
              </div>
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-purple-800 text-center h-8 flex items-center justify-center">Spiritual</div>
              </div>
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-orange-800 text-center h-8 flex items-center justify-center">Personal<br />Development</div>
              </div>
              <div className="text-center w-24">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-2 mx-auto">
                  <Moon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-indigo-800 text-center h-8 flex items-center justify-center">Sleep</div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              <strong>Enterprise-grade frameworks refined over 30 years with hundreds of professionals.</strong> 
              The 6 Pillars Framework manages life complexity, while the Business Happiness Formula optimizes professional satisfaction. 
              Now powered by advanced AI for personalized guidance.
            </p>
            
            <div className="flex justify-center mb-12">
              <UserCount variant="prominent" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            {user ? <Button onClick={handleContinueToDashboard} size="lg" className="bg-primary hover:bg-primary-hover text-lg px-8 py-4 h-auto w-72">
                Continue to Your Dashboard
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
          
          <p className="text-sm text-muted-foreground">30-day free trial • GoalMine.ai's proprietary frameworks • Upgrade for more goals across all pillars</p>
        </div>
      </div>

      {/* 6 Pillars of Life Deep Dive */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Why Most Goal Systems Fail Ambitious Professionals
              </h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                You're juggling career advancement, family relationships, personal growth, health, and spiritual fulfillment. 
                Traditional goal apps treat these as separate items. <strong>Life doesn't work that way.</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* The Problem */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border">
                <h4 className="text-2xl font-bold mb-4 text-red-600">The Problem: Fragmented Approach</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Goals compete for time and energy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>No systematic approach to life's complexities</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Success in one area creates imbalance in others</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Burnout from unsustainable ambitious pursuits</span>
                  </li>
                </ul>
              </div>

              {/* The Solution */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200">
                <h4 className="text-2xl font-bold mb-4 text-blue-600">The Solution: Integrated Life Management</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Systematic approach to life's complexities</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Life gap analysis drive targeted goals to fill them</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Time allocation awareness and conflict detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>AI-powered integration and optimization</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Framework Origins */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">GM</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold">Proven Frameworks, Enterprise Platform</h4>
                  <p className="text-muted-foreground">GoalMine.ai's proprietary frameworks are built on methodologies refined over 30 years with hundreds of professionals, originally developed by successful serial entrepreneur Dan Lynn</p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our frameworks originated from real-world challenges faced by ambitious professionals juggling complex lives—
                demanding careers, family relationships, personal growth, and professional satisfaction. 
                Traditional goal-setting tools failed to address the <strong>systematic complexity management</strong> that high-achievers need. 
                GoalMine.ai has evolved these proven methodologies into an AI-powered platform that scales personalized life architecture for thousands of users.
              </p>
            </div>

            {/* How It Works */}
            <div className="text-center mb-12">
              <h4 className="text-3xl font-bold mb-8">How GoalMine.ai's Platform Works</h4>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-xl">1</span>
                  </div>
                  <h5 className="text-lg font-semibold mb-3">AI-Powered Assessment</h5>
                  <p className="text-muted-foreground text-sm">
                    Our intelligent system captures life complexity gaps and professional happiness factors through proprietary frameworks, delivering insights in under 5 minutes.
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-xl">2</span>
                  </div>
                  <h5 className="text-lg font-semibold mb-3">Intelligent Goal Architecture</h5>
                  <p className="text-muted-foreground text-sm">
                    Advanced AI analyzes your assessment and automatically suggests personalized goals across life domains, 
                    optimizing for time constraints and goal interconnections.
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-xl">3</span>
                  </div>
                  <h5 className="text-lg font-semibold mb-3">Integrated Success Tracking</h5>
                  <p className="text-muted-foreground text-sm">
                    Enterprise-grade dashboard provides real-time progress analytics across all life domains, 
                    with daily AI coaching tailored to your personal success patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">
                Personalized AI-Powered Coaching
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
              <p className="text-muted-foreground leading-relaxed">Get actionable steps each day move you closer towards achieving your goals.</p>
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