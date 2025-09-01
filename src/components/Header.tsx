import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showAuthButton?: boolean;
  onLogoClick?: () => void;
}

export const Header = ({ showAuthButton = true, onLogoClick }: HeaderProps) => {
  const auth = useAuth();
  const navigate = useNavigate();
  
  // Use Firebase auth
  const { user, logout } = auth;

  return (
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => {
            if (onLogoClick) {
              onLogoClick();
            } else {
              navigate('/');
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (onLogoClick) {
                onLogoClick();
              } else {
                navigate('/');
              }
            }
          }}
          aria-label="Go to homepage"
        >
          <h1 className="text-xl font-bold">
            <span className="text-blue-500">Goal</span><span className="text-foreground">Mine.ai</span>
          </h1>
        </div>
        {showAuthButton && (
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Welcome back!</span>
                <Button variant="outline" size="sm" onClick={async () => {
                  await logout();
                  navigate('/auth');
                }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};