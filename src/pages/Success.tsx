import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

export default function Success() {
  const { checkSubscription, subscription } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Check subscription status after successful payment
    const timer = setTimeout(() => {
      checkSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={() => navigate('/')} />
      <div className="flex items-center justify-center p-6 py-16">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <CardTitle className="text-2xl text-success">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for subscribing to GoalMine.ai Premium! Your subscription is now active.
          </p>
          
          {subscription.subscribed && (
            <div className="bg-success-light p-4 rounded-lg">
              <p className="text-sm font-medium text-success">
                Welcome to Premium! 🎉
              </p>
              <p className="text-xs text-success mt-1">
                You now have access to all premium features.
              </p>
            </div>
          )}
          
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            size="lg"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}