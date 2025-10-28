import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface UserCountProps {
  variant?: 'subtle' | 'prominent';
  className?: string;
}

export const UserCount = ({ variant = 'subtle', className = '' }: UserCountProps) => {
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    // Calculate current user count based on days since launch
    const launchDate = new Date('2025-09-29'); // Set to today for testing (115 base)
    const today = new Date();
    const daysSinceLaunch = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Base count + realistic daily growth with some variance
    const baseUsers = 50;
    
    // Only add growth if we have positive days since launch
    let totalGrowth = 0;
    if (daysSinceLaunch > 0) {
      for (let day = 0; day < daysSinceLaunch; day++) {
        // Use day as seed for consistent but varied growth (30-46 range)
        const seed = (day * 17 + 23) % 47; // Simple pseudo-random
        const dailyGrowth = 30 + (seed % 17); // 30-46 range
        totalGrowth += dailyGrowth;
      }
    }
    
    const currentCount = baseUsers + totalGrowth;
    setUserCount(currentCount);
  }, []);

  if (variant === 'prominent') {
    return (
      <div className={`flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium ${className}`}>
        <Users className="w-4 h-4" />
        <span>Join {userCount.toLocaleString()}+ goal achievers</span>
      </div>
    );
  }

  // Subtle variant
  return (
    <div className={`flex items-center gap-1.5 text-muted-foreground text-xs ${className}`}>
      <Users className="w-3 h-3" />
      <span>{userCount.toLocaleString()}+ users</span>
    </div>
  );
};