import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Settings, RefreshCw, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useAuth } from '@/hooks/useAuth';

export const SubscriptionStatus = () => {
  const { user } = useAuth();
  const { subscription, loading, checkSubscription, openCustomerPortal, createCheckout } = useSubscription();
  const { trialStatus } = useTrialStatus();

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              subscription.subscribed ? 'bg-premium-light' : 'bg-muted'
            }`}>
              <Crown className={`w-5 h-5 ${
                subscription.subscribed ? 'text-premium' : 'text-muted-foreground'
              }`} />
            </div>
            <div>
              <CardTitle className="text-xl">Subscription Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your GoalMine.ai subscription
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Plan:</span>
          <Badge 
            variant={subscription.subscribed ? "default" : "secondary"}
            className={subscription.subscribed ? "bg-premium text-premium-foreground" : ""}
          >
            {subscription.subscribed ? subscription.subscription_tier || 'Premium' : 'Free Trial'}
          </Badge>
        </div>

        {subscription.subscribed && subscription.subscription_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Next billing date:</span>
            <span className="text-sm text-muted-foreground">
              {formatDate(subscription.subscription_end)}
            </span>
          </div>
        )}

        {!subscription.subscribed && trialStatus.trialExpiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Trial expires:
            </span>
            <div className="text-right">
              <span className={`text-sm font-medium ${
                trialStatus.daysRemaining <= 3 ? 'text-orange-600' : 
                trialStatus.isTrialExpired ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {trialStatus.isTrialExpired ? 'Expired' : 
                 trialStatus.daysRemaining === 0 ? 'Today' :
                 `${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''}`}
              </span>
              <div className="text-xs text-muted-foreground">
                {formatDate(trialStatus.trialExpiresAt)}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          {subscription.subscribed ? (
            <Button
              onClick={openCustomerPortal}
              disabled={loading}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          ) : (
            <Button
              onClick={createCheckout}
              disabled={loading}
              className="flex-1 bg-premium hover:bg-premium/90"
            >
              <Crown className="w-4 h-4 mr-2" />
              Subscribe to Premium
            </Button>
          )}
        </div>

        {!subscription.subscribed && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Free Trial:</strong> You have access to 1 active goal with daily motivation. 
            Upgrade to Premium for unlimited features and advanced analytics.
          </div>
        )}
      </CardContent>
    </Card>
  );
};