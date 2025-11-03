import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Zap, Target, Trash2 } from "lucide-react";

interface MotivationAlertProps {
  title: string;
  message: string;
  type?: 'motivation' | 'nudge' | 'achievement' | 'upgrade' | 'deletion';
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const MotivationAlert = ({ 
  title, 
  message, 
  type = 'motivation',
  onDismiss,
  autoHide = true,
  duration = 16000 
}: MotivationAlertProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  const getAlertStyles = () => {
    switch (type) {
      case 'nudge':
        return 'border-warning bg-warning text-warning-foreground';
      case 'achievement':
        return 'border-success bg-success text-success-foreground';
      case 'deletion':
        return 'border-success bg-success text-success-foreground';
      case 'upgrade':
        return 'border-primary bg-primary text-primary-foreground';
      default:
        return 'border-primary bg-primary text-primary-foreground';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'nudge':
        return <Zap className="w-5 h-5" />;
      case 'achievement':
        return <Target className="w-5 h-5" />;
      case 'deletion':
        return <Trash2 className="w-5 h-5" />;
      case 'upgrade':
        return <Zap className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`max-w-md w-full mx-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <Alert className={`${getAlertStyles()} shadow-2xl border-2`}>
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1">
              <AlertTitle className="text-base font-semibold mb-1">
                {title}
              </AlertTitle>
              <AlertDescription className="text-sm opacity-90">
                {message}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  );
};