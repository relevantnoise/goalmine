import { Shield, Info } from "lucide-react";
import { Goal } from "@/hooks/useGoals";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakInsuranceProps {
  goal: Goal;
}

export const StreakInsurance = ({ goal }: StreakInsuranceProps) => {
  const insuranceCount = goal.streak_insurance_days || 0;
  const maxInsurance = 3;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Shield className="w-4 h-4" />
        <span className="text-xs">
          {insuranceCount}/{maxInsurance} Insurance
        </span>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3 h-3 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p><strong>Streak Insurance:</strong></p>
              <p>Protects your streak if you miss a day.</p>
              <p>Earn 1 insurance every 7 consecutive check-ins (max 3).</p>
              {insuranceCount === 0 && (
                <p className="text-orange-400">
                  No protection! Missing a day will reset your streak.
                </p>
              )}
              {insuranceCount > 0 && (
                <p className="text-green-400">
                  You're protected for {insuranceCount} missed day{insuranceCount > 1 ? 's' : ''}!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Visual insurance indicators */}
      <div className="flex gap-1">
        {Array.from({ length: maxInsurance }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < insuranceCount 
                ? 'bg-green-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={`Insurance ${i + 1}${i < insuranceCount ? ' - Active' : ' - Earned at next 7-day milestone'}`}
          />
        ))}
      </div>
    </div>
  );
};