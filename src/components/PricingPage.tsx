import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Target, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { UserCount } from "@/components/UserCount";
interface PricingPageProps {
  onStartTrial: () => void;
  onBack: () => void;
}
export const PricingPage = ({
  onStartTrial,
  onBack
}: PricingPageProps) => {
  const {
    user
  } = useAuth();
  const {
    subscription,
    loading,
    createCheckout,
    createProfessionalCheckout
  } = useSubscription();
  const handleSubscribe = () => {
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }
    createCheckout();
  };

  const handleStartTrial = () => {
    if (!user) {
      // Redirect to auth if not logged in for trial
      window.location.href = '/auth';
      return;
    }
    onStartTrial();
  };

  const handleProfessionalSubscribe = () => {
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }
    createProfessionalCheckout();
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
            Try free for 30 days, then continue for just $4.99/month. Professional coaching is also available.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Trial Card */}
          <Card className="border-2 border-trial relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-trial text-trial-foreground text-center py-2 text-sm font-medium">
              Great Way To Start
            </div>
            <CardHeader className="pt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-trial-light rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-trial" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Free Trial</CardTitle>
                  <p className="text-muted-foreground">Perfect to get started on your journey.</p>
                </div>
              </div>
              <div className="text-4xl font-bold">
                $0
                <span className="text-lg font-normal text-muted-foreground">/30 days</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
                  <span>1 active Goal</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
                  <span>Daily personalized motivation</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
                  <span>Choose from 4 AI-powered coaching tones</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
                  <span>Daily micro-plans & mini-challenges</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
                  <span>Daily motivational email</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-trial" />
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
            <CardHeader className="pt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-premium-light rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-premium" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Personal Plan</CardTitle>
                  <p className="text-muted-foreground">The perfect option after your 30-day free trial. And, if you aren't 100% satisfied, you can cancel anytime.</p>
                </div>
              </div>
              <div className="text-4xl font-bold">
                $4.99
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-premium" />
                  <span>Everything in the free trial plus...</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-premium" />
                  <span>Up to 3 active Goals</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-premium" />
                  <span>Up to 3 daily "Nudge Me" requests</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-premium" />
                  <span>Priority chat support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-premium" />
                  <span>Priority new feature announcements</span>
                </li>
              </ul>
              {subscription.subscribed && subscription.subscription_tier === "Personal Plan" ? <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : <Button onClick={handleSubscribe} className="w-full bg-premium hover:bg-premium/90" size="lg" disabled={loading}>
                  {loading ? "Dream Big..." : "Subscribe Now"}
                </Button>}
            </CardContent>
          </Card>

          {/* Professional Coach Card */}
          <Card className="border-2 border-green-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-medium">
              Premium Coaching
            </div>
            <CardHeader className="pt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Professional Coach</CardTitle>
                  <p className="text-muted-foreground">1-on-1 monthly coaching directly with Dan Lynn, co-Founder at Starting Point Ventures.</p>
                </div>
              </div>
              <div className="text-4xl font-bold">
                $750
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <span>Everything in Personal Plan plus...</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <span>1-hour monthly 1-on-1 coaching sessions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <span>Personal goal planning & SMART goal development</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <span>"Right to left" project planning methodology</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <span>Personalized coaching & motivational support</span>
                </li>
              </ul>
              {subscription.subscribed && subscription.subscription_tier === "Professional Coach" ? <Badge variant="secondary" className="w-full justify-center py-3 bg-success text-success-foreground">
                  Current Plan
                </Badge> : <Button onClick={handleProfessionalSubscribe} className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={loading}>
                  {loading ? "Dream Big..." : "Subscribe Now"}
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
              <h3 className="font-semibold mb-2">What's included in Professional Coach?</h3>
              <p className="text-muted-foreground">Professional Coach includes everything from Personal Plan plus a monthly 1-hour 1-on-1 coaching session with Dan Lynn, a successful and seasoned entrepreneur who is the co-founder of Starting Point Ventures and creator of GoalMine.ai. We'll work together on goal planning, SMART goal development, "right to left" project planning, and provide ongoing motivational support tailored to your specific needs.</p>
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
    </div>;
};