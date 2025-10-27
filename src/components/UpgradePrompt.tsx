import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface UpgradePromptProps {
  className?: string;
  compact?: boolean;
}
export const UpgradePrompt = ({
  className = "",
  compact = false
}: UpgradePromptProps) => {
  const navigate = useNavigate();

  // EDIT THIS CONTENT AS NEEDED
  const upgradeContent = {
    title: "Ready for Advanced Goal Management?",
    subtitle: "6 Elements of Life™ system or Personal Plan available",
    pricing: "From $4.99/month",
    buttonText: "View Plans",
    features: [{
      text: "Up to 3 traditional goals OR 6 Elements of Life™"
    }, {
      text: "Systematic life complexity management"
    }, {
      text: "AI-powered integration & optimization"
    }, {
      text: "Strategic coaching sessions available"
    }]
  };
  if (compact) {
    return <div className={`bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20 ${className}`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-foreground text-base">Ready to Level Up?</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Upgrade for more goals and premium features
          </p>
          <Button onClick={() => navigate('/upgrade')} size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base">
            <Crown className="w-3 h-3 mr-1" />
            {upgradeContent.pricing}
          </Button>
        </div>
      </div>;
  }
  return <div className={`bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{upgradeContent.title}</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {upgradeContent.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {upgradeContent.features.map((feature, index) => <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{feature.text}</span>
              </div>)}
          </div>
        </div>
        <div className="ml-6">
          <Button onClick={() => navigate('/upgrade')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3" size="lg">
            <Crown className="w-4 h-4 mr-2" />
            {upgradeContent.buttonText}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">{upgradeContent.pricing}</p>
        </div>
      </div>
    </div>;
};