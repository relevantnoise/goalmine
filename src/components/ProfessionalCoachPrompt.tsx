import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface ProfessionalCoachPromptProps {
  className?: string;
}

export const ProfessionalCoachPrompt = ({
  className = ""
}: ProfessionalCoachPromptProps) => {
  const { createProfessionalCheckout, loading } = useSubscription();

  return (
    <div className={`bg-gradient-to-br from-warning/10 to-warning/20 rounded-lg p-4 border border-warning/20 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-4 h-4 text-warning" />
          <h4 className="font-semibold text-foreground text-base">Get Professional Coaching</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          1-on-1 monthly sessions with Dan Lynn
        </p>
        <Button 
          onClick={createProfessionalCheckout} 
          size="sm" 
          className="w-full bg-warning hover:bg-warning/90 text-warning-foreground text-base"
          disabled={loading}
        >
          <Users className="w-3 h-3 mr-1" />
          $500/month
        </Button>
      </div>
    </div>
  );
};