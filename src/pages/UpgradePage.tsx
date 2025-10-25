import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, ArrowLeft, Target, Zap, Mail, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { DanLynnBioModal } from "@/components/DanLynnBioModal";
import { supabase } from "@/integrations/supabase/client";
import React, { useState } from "react";

export const UpgradePage = () => {
  const [isDanBioOpen, setIsDanBioOpen] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [strategicLoading, setStrategicLoading] = useState(false);
  const { user } = useAuth();
  const { subscription, loading, createCheckout, createProPlanCheckout, createProfessionalCheckout } = useSubscription();
  const navigate = useNavigate();

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

  const handleProfessionalSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Strategic Advisor Plan button clicked - FINAL ATTEMPT');
    
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    setStrategicLoading(true);
    try {
      // Call create-checkout function with strategic_advisory tier
      console.log('🎯 Calling create-checkout with strategic_advisory tier');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          email: user.email,
          userId: user.id,
          tier: 'strategic_advisory',
          priceId: 'price_1SCPJLCElVmMOup293vWqNTQ', // Explicit $950/month price
        },
      });

      if (error) throw new Error(error.message || 'Strategic Advisor Plan checkout failed');
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('🎯 Strategic Advisor Plan - Error:', error);
    } finally {
      setStrategicLoading(false);
    }
  };

  const handleProPlanSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Pro Plan button clicked from UpgradePage');
    
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    setProLoading(true);
    try {
      console.log('🎯 Pro Plan - Calling createProPlanCheckout');
      await createProPlanCheckout();
    } catch (error) {
      console.error('🎯 Pro Plan - Error:', error);
    } finally {
      setProLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={() => navigate('/dashboard')} />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back Button */}
        <div className="mb-3">
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="default" 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Ready for More Advanced Goal Management?
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            You've reached the free limit. Upgrade to Personal Plan for traditional multi-goal tracking, 
            or discover our revolutionary <strong>5 Circle Life Management™</strong> system - a proven framework for managing complex life priorities.
          </p>
        </div>

        {/* Premium Plan Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-6">
          <Card className="border-2 border-premium relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 bg-premium text-premium-foreground text-center py-2 text-sm font-medium">
              Most Affordable
            </div>
            <CardHeader className="pt-12 text-center">
              <CardTitle className="text-lg mb-2">Personal Plan</CardTitle>
              <p className="text-sm text-muted-foreground mb-3">Everything you need to achieve your goals</p>
              <div className="text-2xl font-bold text-premium">
                $4.99
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Up to 3 Goals Across Any Circles</span>
                    <p className="text-xs text-muted-foreground">Create goals in multiple life circles simultaneously</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Daily AI-Powered Motivation</span>
                    <p className="text-xs text-muted-foreground">Fresh, personalized motivation every day</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Up to 3 Daily Nudges</span>
                    <p className="text-xs text-muted-foreground">Get extra motivation when you need it most</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Custom Coaching Tones</span>
                    <p className="text-xs text-muted-foreground">Choose from 4 different motivational styles</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Daily Wake-Up Call</span>
                    <p className="text-xs text-muted-foreground">Never miss your daily dose of inspiration</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-premium mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Priority Support</span>
                    <p className="text-xs text-muted-foreground">Get help when you need it</p>
                  </div>
                </li>
              </ul>

              {subscription.subscribed && subscription.subscription_tier === "Personal Plan" ? (
                <div className="bg-success-light/20 text-success border border-success/20 rounded-lg p-4 text-center">
                  <Crown className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">You're already a Personal Plan member!</p>
                  <p className="text-sm opacity-90">Go back to set your new goal</p>
                </div>
              ) : (
                <Button 
                  onClick={handleSubscribe} 
                  className="w-full bg-premium hover:bg-premium/90 text-premium-foreground" 
                  size="lg" 
                  disabled={personalLoading}
                >
                  {personalLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-premium-foreground border-t-transparent rounded-full mr-2" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan Card - 5 Circle Framework */}
          <Card className="border-2 border-blue-600 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="pt-12 text-center">
              <CardTitle className="text-lg mb-2">Professional Plan</CardTitle>
              <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full inline-block mb-2">
                ADVANCED FEATURES
              </div>
              <p className="text-sm text-muted-foreground mb-2">Advanced features for complete life management across all circles. Maximize your 5 Circle Framework experience.</p>
              <button 
                onClick={() => setIsDanBioOpen(true)}
                className="text-blue-600 hover:text-blue-700 text-sm underline mb-3 cursor-pointer"
              >
                Learn about the creator
              </button>
              <div className="text-2xl font-bold text-blue-600">
                $199.99
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Everything in Personal Plan</span>
                    <p className="text-xs text-muted-foreground">All Personal Plan features included</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Up to 5 Goals Across All Circles</span>
                    <p className="text-xs text-muted-foreground">Complete life coverage with multiple goals per circle</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Enhanced Circle Dashboard</span>
                    <p className="text-xs text-muted-foreground">Advanced analytics, optimization, and circle integration</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">AI Life Assessment</span>
                    <p className="text-xs text-muted-foreground">Intelligent integration & optimization</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Up to 5 Goals + 5 Nudges</span>
                    <p className="text-xs text-muted-foreground">One goal per circle + daily motivation</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Stress Reduction System</span>
                    <p className="text-xs text-muted-foreground">Break overwhelm into manageable pieces</p>
                  </div>
                </li>
              </ul>

              {subscription.subscribed && subscription.subscription_tier === "Pro Plan" ? (
                <div className="bg-success-light/20 text-success border border-success/20 rounded-lg p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">You're a Pro Plan member!</p>
                  <p className="text-sm opacity-90">Enjoy your enhanced features</p>
                </div>
              ) : (
                <Button 
                  onClick={handleProPlanSubscribe} 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  size="lg" 
                  disabled={proLoading}
                >
                  {proLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Professional Coach Card */}
          <Card className="border-2 border-green-600 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-medium">
              One-on-One Coaching
            </div>
            <CardHeader className="pt-12 text-center">
              <CardTitle className="text-lg mb-2">Strategic Advisor Plan</CardTitle>
              <p className="text-sm text-muted-foreground mb-2">2-hour quarterly 1-on-1 coaching sessions with Dan Lynn.</p>
              <button 
                onClick={() => setIsDanBioOpen(true)}
                className="text-green-600 hover:text-green-700 text-sm underline mb-3 cursor-pointer"
              >
                Learn more about Dan
              </button>
              <div className="text-2xl font-bold text-green-600">
                $950
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 mb-3">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Everything in Pro Plan</span>
                    <p className="text-xs text-muted-foreground">All Pro Plan features included</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Strategic Business Advisory</span>
                    <p className="text-xs text-muted-foreground">Direct strategic sessions with Dan Lynn</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">SMART Goal Development</span>
                    <p className="text-xs text-muted-foreground">Professional goal structuring and planning</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">"Right to Left" Planning</span>
                    <p className="text-xs text-muted-foreground">Strategic project planning methodology</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Executive-Level Guidance</span>
                    <p className="text-xs text-muted-foreground">Strategic business advisory & execution support</p>
                  </div>
                </li>
              </ul>

              {subscription.subscribed && subscription.subscription_tier === "Professional Coach" ? (
                <div className="bg-success-light/20 text-success border border-success/20 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">You're a Professional Coach member!</p>
                  <p className="text-sm opacity-90">Enjoy your premium coaching experience</p>
                </div>
              ) : (
                <Button 
                  onClick={handleProfessionalSubscribe} 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  size="lg" 
                  disabled={strategicLoading}
                >
                  {strategicLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Dream Big...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Multiple Goals</h3>
            <p className="text-xs text-muted-foreground">
              Work on fitness, career, relationships, and more simultaneously
            </p>
          </div>
          <div className="text-center p-3">
            <div className="w-8 h-8 bg-success-light rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-sm font-semibold mb-1">AI-Powered</h3>
            <p className="text-xs text-muted-foreground">
              Advanced AI creates personalized motivation based on your progress
            </p>
          </div>
          <div className="text-center p-3">
            <div className="w-8 h-8 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-2">
              <Mail className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Daily Delivery</h3>
            <p className="text-xs text-muted-foreground">
              Get your motivation delivered directly to your inbox every day
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-base font-semibold text-center mb-3">Why Upgrade?</h2>
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-1">Multiple Goals = Better Results</h3>
              <p className="text-xs text-muted-foreground">
                Research shows that people who work on complementary goals (like fitness + career) 
                see better outcomes in both areas through positive momentum transfer.
              </p>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <h3 className="text-sm font-medium mb-1">Cancel Anytime</h3>
              <p className="text-xs text-muted-foreground">
                No long-term commitment. You can cancel your subscription at any time 
                and keep access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dan Lynn Bio Modal */}
      <DanLynnBioModal 
        isOpen={isDanBioOpen} 
        onClose={() => setIsDanBioOpen(false)} 
      />
    </div>
  );
};