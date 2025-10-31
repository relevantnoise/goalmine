import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Clock, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining?: number;
}

export const TrialExpiredModal = ({ isOpen, onClose, daysRemaining = 0 }: TrialExpiredModalProps) => {
  const { createCheckout, loading } = useSubscription();

  const handleUpgrade = async () => {
    await createCheckout();
    // Don't close modal immediately - user will be redirected to Stripe
  };

  const isExpired = daysRemaining <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] mx-4 max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-premium-light rounded-full flex items-center justify-center">
              {isExpired ? (
                <Crown className="w-6 h-6 text-premium" />
              ) : (
                <Clock className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isExpired ? "Free Trial Expired" : `${daysRemaining} Days Remaining`}
              </DialogTitle>
              <DialogDescription>
                {isExpired 
                  ? "Upgrade to continue using GoalMine.ai"
                  : "Your free trial will expire soon"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {isExpired ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">Access Restricted</h3>
              <p className="text-sm text-muted-foreground">
                Your 30-day free trial has ended. Upgrade to Personal Plan for traditional goal tracking,
                or discover our revolutionary 5 Circle Life Management™ system for comprehensive life's complexities management.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Trial Ending Soon</h3>
              <p className="text-sm text-orange-700">
                You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your free trial. 
                Upgrade now to ensure uninterrupted access to your goals.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-premium" />
              Premium Plan Options
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-premium" />
                Personal Plan: Up to 3 traditional goals ($4.99/month)
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-blue-600" />
                5 Circle Framework™: Revolutionary life management system
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-premium" />
                Daily AI-powered motivation & wake-up calls
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-premium" />
                Systematic complexity management & optimization
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-premium" />
                Cancel anytime
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            {!isExpired && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                Continue Trial
              </Button>
            )}
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className={`bg-premium hover:bg-premium/90 ${isExpired ? 'flex-1' : 'flex-1'}`}
            >
              <Crown className="w-4 h-4 mr-2" />
{loading ? "Dream Big..." : "View All Plans - From $4.99/month"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};