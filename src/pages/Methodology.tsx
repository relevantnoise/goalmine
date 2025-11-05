import { Button } from "@/components/ui/button";
import { Target, Briefcase, Users, Activity, BookOpen, Heart, Moon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";

export const Methodology = () => {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pillars = [
    { name: "Work", icon: Briefcase, description: "Career, job(s) (including commute time)" },
    { name: "Sleep", icon: Moon, description: "Rest, recovery, energy management" },
    { name: "Family & Friends", icon: Users, description: "Relationships, social connections" },
    { name: "Health & Fitness", icon: Activity, description: "Physical wellbeing, energy, vitality" },
    { name: "Personal Development", icon: BookOpen, description: "Learning, growth, skills" },
    { name: "Spiritual", icon: Heart, description: "Faith, inner purpose, values, meaning" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onLogoClick={() => navigate('/')} />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Button>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 flex items-center justify-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Our Proven Frameworks
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Two sophisticated methodologies working together to transform scattered goals into integrated life management
            </p>
          </div>

          <div className="space-y-8">
            {/* Framework Origins */}
            <div className="bg-blue-50 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">Proven Methodologies, Enterprise Platform</h2>
              <p className="text-blue-800 leading-relaxed mb-4">
                GoalMine.ai's proprietary frameworks originated from real-world challenges faced by ambitious professionals 
                managing complex lives—demanding careers, family relationships, personal growth, and professional satisfaction. 
                Originally developed 30 years ago by entrepreneur Dan Lynn while juggling strategy roles at AT&T, MBA studies, 
                family commitments, entrepreneurial aspirations, fitness routines, and his faith, <strong>these methodologies solved the time management crisis 
                that traditional goal-setting tools couldn't address.</strong>
              </p>
              <p className="text-blue-800 leading-relaxed">
                GoalMine.ai has evolved these proven frameworks into an AI-powered platform that scales personalized life architecture 
                for thousands of users, providing enterprise-grade systematic complexity management for ambitious professionals.
              </p>
            </div>

            {/* The 6 Pillars Framework */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">The 6 Pillars of Life Framework™</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                A comprehensive system for balancing all essential life domains. Each pillar represents a critical area that affects your overall satisfaction and success.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.name} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-6 h-6 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-800">{pillar.name}</h3>
                      </div>
                      <p className="text-gray-600">{pillar.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Happiness Formula */}
            <div className="bg-amber-50 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-amber-900">The Business Happiness Formula™</h2>
              <p className="text-amber-800 leading-relaxed mb-4">
                GoalMine.ai's proprietary Business Happiness Formula identifies the core drivers of professional satisfaction: 
                <strong> impact, fun, compensation, and flexibility (location/schedule).</strong> Our platform's intelligent assessment captures 
                your unique weighting of these variables to optimize career fulfillment.
              </p>
              <p className="text-amber-800 leading-relaxed">
                This specialized framework works within the Work pillar to provide granular professional optimization, 
                ensuring not just career advancement but genuine workplace satisfaction aligned with your personal values and lifestyle preferences.
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-green-50 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-green-900">How GoalMine.ai's Platform Works</h2>
              <div className="space-y-4 text-green-800">
                <div className="flex gap-3">
                  <span className="font-bold text-green-900">1.</span>
                  <div>
                    <strong>AI Assessment:</strong> Intelligent system captures your current and desired state across all life domains
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-green-900">2.</span>
                  <div>
                    <strong>Gap Analysis:</strong> Advanced algorithms identify priority areas for maximum life transformation
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-green-900">3.</span>
                  <div>
                    <strong>Goal Creation & Management:</strong> Create goals across any pillar with personalized AI coaching and daily motivation
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-green-900">4.</span>
                  <div>
                    <strong>Life Evolution Updates:</strong> Update your assessment as your life changes to maintain accurate insights and balance
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-green-900">5.</span>
                  <div>
                    <strong>Daily Motivation System:</strong> Daily AI-powered motivational email boosts as well as goal-specific motivational content in the AI coaching tone of your choice
                  </div>
                </div>
              </div>
            </div>

            {/* Why It Works */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Why GoalMine.ai's Platform Works</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Enterprise-Grade Intelligence</h3>
                  <p className="text-gray-600">Advanced AI addresses all life domains simultaneously, preventing the common trap of success in one area at the expense of others</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Personalized Architecture</h3>
                  <p className="text-gray-600">Intelligent algorithms analyze your complexity patterns to reveal where you should focus energy for maximum life transformation</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Optimized Resource Allocation</h3>
                  <p className="text-gray-600">Platform-assisted time allocation across domains based on your personal definitions, priorities, and constraints</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Proven Methodologies</h3>
                  <p className="text-gray-600">30 years of framework refinement scaled through AI for thousands of ambitious professionals managing complex lives</p>
                </div>
              </div>
            </div>

            {/* Philosophy */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-lg">
              <p className="text-2xl font-semibold text-primary mb-4 italic">
                Remember, happiness isn't achieving the goal. Happiness is the journey.
              </p>
              <p className="text-gray-600">
                Our frameworks don't just help you create goals to address the complexities and stress drivers in your life.
              </p>
            </div>

            {/* Navigation */}
            <div className="text-center pt-8 border-t">
              <Button 
                onClick={() => {
                  navigate('/');
                  // Ensure scroll to top after navigation
                  setTimeout(() => window.scrollTo(0, 0), 100);
                }}
                variant="outline"
                size="lg"
                className="text-primary border-primary hover:bg-primary hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};