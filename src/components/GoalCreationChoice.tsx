import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Settings, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";

interface GoalCreationChoiceProps {
  onTraditionalGoal: () => void;
  onFiveCircleFramework: () => void;
  onBack: () => void;
}

export const GoalCreationChoice = ({ onTraditionalGoal, onFiveCircleFramework, onBack }: GoalCreationChoiceProps) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={onBack} />
      <div className="flex items-center justify-center px-6 pt-8">
        <Card className="w-full max-w-3xl border border-border shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-card-foreground mb-4">
              Choose Your Goal Management Approach
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              As a Pro Plan member, you have access to our advanced 5 Circle Life Management System
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Traditional Goal Option */}
              <button
                onClick={onTraditionalGoal}
                onMouseEnter={() => setHoveredOption('traditional')}
                onMouseLeave={() => setHoveredOption(null)}
                className={`p-6 rounded-xl border-2 transition-all text-left h-full ${
                  hoveredOption === 'traditional' 
                    ? 'border-primary bg-primary-light shadow-lg transform scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    hoveredOption === 'traditional' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Traditional Goal</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a single, focused goal with AI-powered daily motivation and tracking. Perfect for specific objectives.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Quick setup (2 minutes)</li>
                      <li>• Single goal focus</li>
                      <li>• Daily AI motivation</li>
                      <li>• Streak tracking</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </button>

              {/* 5 Circle Framework Option */}
              <button
                onClick={onFiveCircleFramework}
                onMouseEnter={() => setHoveredOption('five-circle')}
                onMouseLeave={() => setHoveredOption(null)}
                className={`p-6 rounded-xl border-2 transition-all text-left h-full ${
                  hoveredOption === 'five-circle' 
                    ? 'border-primary bg-primary-light shadow-lg transform scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    hoveredOption === 'five-circle' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">5 Circle Life Management</h3>
                    <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full inline-block mb-2">
                      RECOMMENDED
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Systematic approach to managing complex life priorities. Break down overwhelm into manageable, integrated circles.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Comprehensive life assessment (15 mins)</li>
                      <li>• 5 integrated life circles</li>
                      <li>• AI-guided goal creation per circle</li>
                      <li>• Weekly optimization & review</li>
                      <li>• Stress reduction through complexity management</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </button>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="text-blue-600">
                  <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Why choose 5 Circle Life Management?</h4>
                  <p className="text-blue-800 text-sm">
                    Most ambitious professionals feel overwhelmed trying to balance work, family, health, personal growth, and spiritual life. 
                    Our 5 Circle system breaks this complexity into manageable components with integrated optimization. 
                    You can always create traditional goals later.
                  </p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};