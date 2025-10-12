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
          <h1 className="text-4xl font-bold text-foreground mb-4">Start Your First Goal</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your goals into achievements with personalized daily motivation. 
            Try free for 30 days, then continue for just $4.99/month. Professional plans and one-on-one strategic coaching are also available.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Trial Card */}
          <Card className="border-2 border-trial relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-trial text-trial-foreground text-center py-2 text-sm font-medium">
              Great Way To Start
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Free Trial</CardTitle>
                <p className="text-muted-foreground text-sm">Perfect to get started on your goal achievement journey.</p>
              </div>
              <div className="text-2xl font-bold">
                $0
                <span className="text-sm font-normal text-muted-foreground">/30 days</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>1 active Goal</span>
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
                  <span>Daily motivational email</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-trial mt-0.5 flex-shrink-0" />
                  <span>Streak tracking</span>
                </li>
              </ul>
              <Button onClick={handleStartTrial} className="w-full bg-trial hover:bg-trial/90" size="lg" disabled={loading}>
                {loading ? "Dream Big..." : "Start Free Trial"}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Card */}
          <Card className="border-2 border-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-premium text-premium-foreground text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Personal Plan</CardTitle>
                <p className="text-muted-foreground text-sm">The perfect option after your free trial. Cancel anytime.</p>
              </div>
              <div className="text-2xl font-bold">
                $4.99
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Everything in the free trial plus...</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Up to 3 active Goals</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <span>Up to 3 daily "Nudge Me" requests</span>
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

          {/* Pro Plan Card */}
          <Card className="border-2 border-blue-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium">
              Power User Choice
            </div>
            <CardHeader className="pt-12 text-center">
              <div className="mb-4">
                <CardTitle className="text-lg mb-2">Pro Plan</CardTitle>
                <p className="text-muted-foreground text-sm mb-2">For ambitious individuals managing multiple life areas.</p>
                <button 
                  onClick={() => setIsDanBioOpen(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm underline cursor-pointer"
                >
                  Learn more about Dan
                </button>
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
                  <span>Up to 5 active Goals</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Up to 5 daily "Nudge Me" requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>1-hour monthly group Q&A with Dan Lynn</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Priority support & feature access</span>
                </li>
              </ul>
              {subscription.subscribed && subscription.subscription_tier === "Pro Plan" ? 
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
                <p className="text-muted-foreground text-sm mb-2">2-hour quarterly 1-on-1 coaching sessions with Dan Lynn.</p>
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
                  <span>Everything in Pro Plan plus...</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Strategic business advisory sessions</span>
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
              {subscription.subscribed && subscription.subscription_tier === "Professional Coach" ? <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : <Button onClick={handleProfessionalSubscribe} className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={strategicLoading}>
                  <Users className="w-4 h-4 mr-2" />
                  {strategicLoading ? "Dream Big..." : "Subscribe Now"}
                </Button>}
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized Goals</h3>
            <p className="text-muted-foreground">
              Each Goal is tailored to your specific goal and preferred coaching style.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Daily Motivation</h3>
            <p className="text-muted-foreground">
              Get fresh inspiration and actionable micro-plans delivered daily.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
            <p className="text-muted-foreground">
              Small daily actions compound into life-changing achievements.
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
              <p className="text-muted-foreground">Yes! While you can have one Goal in the 30-day trial, our Personal Plan enables you to have up to 3 Goals for just $4.99/month, so you can run multiple Goals simultaneously for different goals (fitness, health, career, relationships, etc.).</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What's included in Strategic Advisor Plan?</h3>
              <p className="text-muted-foreground">Strategic Advisor Plan includes everything from Personal Plan plus 2-hour quarterly 1-on-1 professional coach/strategic advisory sessions with Dan Lynn, co-Founder and Managing Director at Starting Point Ventures, a successful serial entrepreneur and Fortune 500 executive. Also includes the ability to email him from time-to-time during the quarter with questions that may come up between sessions. We'll work together on strategic goal planning, business execution methodology, "right to left" project planning, and provide executive-level guidance tailored to your specific business challenges.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after my 30-day trial?</h3>
              <p className="text-muted-foreground">After 30-days you will have to upgrade to our Personal Plan.  Your existing Goal will continue seamlessly.  Remember that if you aren't completely satisfied, you can cancel anytime.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="outline" onClick={onBack} className="mr-4">
            Back
          </Button>
          <Button onClick={subscription.subscribed ? handleSubscribe : handleStartTrial} size="lg" className="bg-trial hover:bg-trial/90" disabled={loading}>
            {loading ? "Dream Big..." : subscription.subscribed ? "Manage Subscription" : "Start Your Free Trial Today"}
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