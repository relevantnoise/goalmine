import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Target, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { UserCount } from "@/components/UserCount";
import { DanLynnBioModal } from "@/components/DanLynnBioModal";
import React, { useState } from "react";
interface PricingPageProps {
  onStartTrial: () => void;
  onBack: () => void;
}
export const PricingPage = ({
  onStartTrial,
  onBack
}: PricingPageProps) => {
  // Bio modal functionality added - force deployment
  const [isDanBioOpen, setIsDanBioOpen] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [strategicLoading, setStrategicLoading] = useState(false);
  const {
    user
  } = useAuth();
  const {
    subscription,
    loading,
    createCheckout,
    createProPlanCheckout,
    createProfessionalCheckout
  } = useSubscription();
  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚨 Personal Plan button clicked - THIS SHOULD NOT FIRE WHEN CLICKING STRATEGIC ADVISOR');
    console.log('🚨 Personal Plan - User:', user?.email);
    
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }
    
    setPersonalLoading(true);
    try {
      console.log('🚨 Personal Plan - Calling createCheckout');
      await createCheckout();
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleStartTrial = () => {
    if (!user) {
      // Redirect to auth if not logged in for trial
      window.location.href = '/auth';
      return;
    }
    onStartTrial();
  };

  const handleProfessionalSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Strategic Advisor Plan button clicked - START');
    console.log('🎯 Strategic Advisor Plan - User:', user?.email);
    console.log('🎯 Strategic Advisor Plan - About to call createProfessionalCheckout');
    
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }
    
    setStrategicLoading(true);
    try {
      console.log('🎯 Strategic Advisor Plan - Calling createProfessionalCheckout NOW');
      await createProfessionalCheckout();
      console.log('🎯 Strategic Advisor Plan - createProfessionalCheckout completed');
    } catch (error) {
      console.error('🎯 Strategic Advisor Plan - Error:', error);
    } finally {
      setStrategicLoading(false);
    }
  };

  const handleProPlanSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Pro Plan button clicked');
    console.log('🎯 Pro Plan - User:', user?.email);
    
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }
    
    setProLoading(true);
    try {
      console.log('🎯 Pro Plan - Calling createProPlanCheckout');
      await createProPlanCheckout();
      console.log('🎯 Pro Plan - createProPlanCheckout completed');
    } catch (error) {
      console.error('🎯 Pro Plan - Error:', error);
    } finally {
      setProLoading(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={onBack} />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <UserCount variant="subtle" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Start Your GoalMine.ai Journey</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover your highest-leverage opportunities for life optimization with our proven frameworks. Experience the 6 Pillars of Life Framework™ + Business Happiness Formula™ 
            with AI-powered insights. Start with our free plan, then upgrade starting as low as $24.99/month to unlock more goals and gain access to a full AI-powered analysis of your personal assessement.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Trial Card */}
          <Card className="border-2 border-trial relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-trial text-trial-foreground text-center py-2 text-sm font-medium">
              Free Plan
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Free Plan</CardTitle>
                <p className="text-muted-foreground text-sm">Perfect to get started on your goal achievement journey.</p>
              </div>
              <div className="text-2xl font-bold">
                $0
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>6 Pillars of Life Framework™ + Business Happiness Formula™ assessment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>1 goal from any pillar</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Daily personalized motivation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Choose from 4 AI-powered coaching tones</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Daily micro-plans & mini-challenges</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Daily wake-up call email</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Streak tracking</span>
                </li>
              </ul>
              <Button onClick={handleStartTrial} className="w-full bg-trial hover:bg-trial/90" size="lg" disabled={loading}>
                {loading ? "Dream Big..." : "Get Started Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Card */}
          <Card className="border-2 border-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-premium text-premium-foreground text-center py-2 text-sm font-medium">
              Most Affordable
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Personal Plan</CardTitle>
                <p className="text-muted-foreground text-sm">Perfect for managing multiple goals with AI-powered framework analysis. Cancel anytime.</p>
              </div>
              <div className="text-2xl font-bold">
                $24.99
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Everything in free plan plus...</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Up to 3 goals across any pillars</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Up to 3 daily "Nudge Me" requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span><strong>Full AI Analysis Report</strong> - 6 Pillars Framework™ + Business Happiness Formula™ insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Priority chat support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Priority new feature announcements</span>
                </li>
              </ul>
              {subscription.subscribed && subscription.subscription_tier === "Personal Plan" ? <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : <Button onClick={handleSubscribe} className="w-full bg-premium hover:bg-premium/90" size="lg" disabled={personalLoading}>
                  <Crown className="w-4 h-4 mr-2" />
                  {personalLoading ? "Dream Big..." : "Subscribe Now"}
                </Button>}
            </CardContent>
          </Card>

          {/* Pro Plan Card - 6 Pillars of Life */}
          <Card className="border-2 border-blue-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Professional Plan</CardTitle>
                <p className="text-muted-foreground text-sm mb-2">Ideal for high achievers managing multiple priorities - with 10 goals, you can optimize results across all 6 pillars.</p>
              </div>
              <div className="text-2xl font-bold">
                $199.99
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Everything in Personal Plan plus...</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Up to 10 goals across all pillars</strong> - Manage complex life priorities effectively</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Up to 10 daily nudges</strong> - Stay motivated throughout your day</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Full 6 Pillars Framework™ system with goal optimization across all areas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Business Happiness Formula™ optimization for professional satisfaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Exclusive Full AI Analysis Report</strong> - Comprehensive strategic insights and recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>AI-powered insights and strategic guidance across all life domains</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Priority support and feature access</span>
                </li>
              </ul>
              {subscription.subscribed && (subscription.subscription_tier === "Professional Plan" || subscription.subscription_tier === "Pro Plan") ? 
                <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : 
                <Button onClick={handleProPlanSubscribe} className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={proLoading}>
                  <Target className="w-4 h-4 mr-2" />
                  {proLoading ? "Dream Big..." : "Subscribe Now"}
                </Button>
              }
            </CardContent>
          </Card>

          {/* Strategic Advisor Plan Card */}
          <Card className="border-2 border-green-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-medium">
              One-on-One Coaching
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Strategic Advisor Plan</CardTitle>
                <p className="text-muted-foreground text-sm mb-2">2-hour quarterly 1-on-1 coaching sessions with our founder, Dan Lynn.</p>
                <button 
                  onClick={() => setIsDanBioOpen(true)}
                  className="text-green-600 hover:text-green-700 text-sm underline cursor-pointer"
                >
                  Learn more about Dan
                </button>
              </div>
              <div className="text-2xl font-bold">
                $950
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Everything in Professional Plan plus...</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>2-hour, 1-on-1 quarterly advisory sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Personal goal planning & SMART goal development</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>"Right to left" project planning methodology</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Executive-level strategic guidance</span>
                </li>
              </ul>
              {subscription.subscribed && (subscription.subscription_tier === "Strategic Advisor Plan" || subscription.subscription_tier === "Professional Coach") ? <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : <Button onClick={handleProfessionalSubscribe} className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={strategicLoading}>
                  <Users className="w-4 h-4 mr-2" />
                  {strategicLoading ? "Dream Big..." : "Subscribe Now"}
                </Button>}
            </CardContent>
          </Card>
        </div>

        {/* 6 Pillars of Life Showcase */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">The 6 Pillars of Life Framework™</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A proven system for optimizing results across work, health, relationships, and growth, developed over 30 years with hundreds of high achievers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">The Problem It Solves</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Feeling overwhelmed by competing life priorities</li>
                <li>• Struggling to make progress on everything that matters</li>
                <li>• Stress from reactive vs. proactive life management</li>
                <li>• Guilt about always "neglecting something important"</li>
                <li>• Lack of systematic approach to complex life goals</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">The 6 Pillars Solution</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Work:</strong> Career growth and performance</li>
                <li>• <strong>Sleep:</strong> Rest, recovery, sleep optimization</li>
                <li>• <strong>Family & Friends:</strong> Relationships that matter</li>
                <li>• <strong>Health & Fitness:</strong> Physical vitality and energy</li>
                <li>• <strong>Personal Development:</strong> Skills and growth</li>
                <li>• <strong>Spiritual:</strong> Meaning, purpose, inner peace</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Born from Real-World Success</h4>
                <p className="text-blue-800 text-sm">
                  "Our proven framework has been impacting lives for over 30 years. I first developed this system as a rising professional 
                  juggling a demanding strategy job at AT&T, pursuing my MBA at Rutgers, with a wife and two kids under 3. I was overwhelmed 
                  and created this framework out of necessity - and it worked. Since then, I've helped hundreds of high achievers 
                  use this system to discover their highest-leverage opportunities and systematically achieve their most important goals." - Dan Lynn, Creator
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Systematic Complexity Management</h3>
            <p className="text-muted-foreground">
              Break down overwhelming life's complexities into manageable, integrated components.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Optimization</h3>
            <p className="text-muted-foreground">
              Get intelligent insights, synergy opportunities, and weekly optimization recommendations.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Proven Track Record</h3>
            <p className="text-muted-foreground">
              30+ years of development, refined through real-world application with hundreds of professionals.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What exactly is a "Goal" and a "Nudge"?</h3>
              <p className="text-muted-foreground">A Goal is your personal goal journey. Each Goal within GoalMine.ai receives personalized daily motivation, micro-plans, and challenges tailored to your preferred coaching style.  A Nudge is an additional Motivational message you can receive during the day to give you an added boost. </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I have multiple Goals?</h3>
              <p className="text-muted-foreground">Yes! While you can have one Goal on our free plan, our Personal Plan enables you to have up to 3 Goals for just $24.99/month, so you can run multiple Goals simultaneously for different goals (fitness, health, career, relationships, etc.).</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What's included in Strategic Advisor Plan?</h3>
              <p className="text-muted-foreground">Strategic Advisor Plan includes everything from Personal Plan plus 2-hour quarterly 1-on-1 professional coach/strategic advisory sessions with Dan Lynn, co-Founder and Managing Director at Starting Point Ventures, a successful serial entrepreneur and Fortune 500 executive. Also includes the ability to email him from time-to-time during the quarter with questions that may come up between sessions. We'll work together on strategic goal planning, business execution methodology, "right to left" project planning, and provide executive-level guidance tailored to your specific business challenges.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does the free plan work?</h3>
              <p className="text-muted-foreground">Our free plan gives you access to GoalMine.ai with 1 goal, full framework access, and daily motivation emails. Upgrade to Personal Plan anytime to add more goals and enhanced features.  Your existing Goal will continue seamlessly.  Remember that if you aren't completely satisfied, you can cancel anytime.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="outline" onClick={onBack} className="mr-4">
            Back
          </Button>
          <Button onClick={subscription.subscribed ? handleSubscribe : handleStartTrial} size="lg" className="bg-trial hover:bg-trial/90" disabled={loading}>
            {loading ? "Dream Big..." : subscription.subscribed ? "Manage Subscription" : "Get Started Free Today"}
          </Button>
        </div>
      </div>
      
      {/* Dan Lynn Bio Modal */}
      <DanLynnBioModal 
        isOpen={isDanBioOpen} 
        onClose={() => setIsDanBioOpen(false)} 
      />
    </div>;
};