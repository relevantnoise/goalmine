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

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFromGoalLimit?: boolean;
}

export const TrialExpiredModal = ({ isOpen, onClose, isFromGoalLimit = false }: UpgradeModalProps) => {
  const { createCheckout, loading } = useSubscription();

  const handleUpgrade = async () => {
    await createCheckout();
    // Don't close modal immediately - user will be redirected to Stripe
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] mx-4 max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-premium-light rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-premium" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isFromGoalLimit ? "Goal Limit Reached" : "Upgrade to Personal Plan"}
              </DialogTitle>
              <DialogDescription>
                {isFromGoalLimit 
                  ? "Upgrade to Personal Plan to create more goals"
                  : "Unlock more goals and premium features"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Free Plan Active</h3>
            <p className="text-sm text-blue-700">
              Your free GoalMine.ai account gives you 1 goal. Upgrade to Personal Plan for up to 3 goals,
              or discover our revolutionary 6 Pillars of Life Framework™ + Business Happiness Formula™ for comprehensive life optimization.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-premium" />
              Premium Plan Options
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-premium" />
                Personal Plan: Up to 3 goals ($24.99/month)
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-blue-600" />
                6 Pillars Framework™: Revolutionary life management system
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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue Free Plan
            </Button>
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-premium hover:bg-premium/90 flex-1"
            >
              <Crown className="w-4 h-4 mr-2" />
              {loading ? "Dream Big..." : "View All Plans - From $24.99/month"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};