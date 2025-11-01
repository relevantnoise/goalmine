import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, Briefcase, Users, Activity, BookOpen, Heart, Moon } from "lucide-react";

interface FrameworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkInfoModal = ({ isOpen, onClose }: FrameworkInfoModalProps) => {
  const pillars = [
    { name: "Work", icon: Briefcase, description: "Career, job(s) (including commute time)" },
    { name: "Sleep", icon: Moon, description: "Rest, recovery, energy management" },
    { name: "Friends & Family", icon: Users, description: "Relationships, social connections" },
    { name: "Health & Fitness", icon: Activity, description: "Physical wellbeing, energy, vitality" },
    { name: "Personal Development", icon: BookOpen, description: "Learning, growth, skills" },
    { name: "Spiritual", icon: Heart, description: "Inner purpose, values, meaning" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            6 Pillars of Life Framework™ + Business Happiness Formula™
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Framework Origins */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-900">Proven Methodologies, Enterprise Platform</h3>
            <p className="text-blue-800 leading-relaxed">
              GoalMine.ai's proprietary frameworks originated from real-world challenges faced by ambitious professionals 
              managing complex lives—demanding careers, family relationships, personal growth, and professional satisfaction. 
              Originally developed 30 years ago by entrepreneur Dan Lynn while juggling strategy roles at AT&T, MBA studies, 
              family commitments, and entrepreneurial aspirations, <strong>these methodologies solved the time management crisis 
              that traditional goal-setting tools couldn't address.</strong>
            </p>
            <p className="text-blue-800 leading-relaxed mt-3">
              GoalMine.ai has evolved these proven frameworks into an AI-powered platform that scales personalized life architecture 
              for thousands of users, providing enterprise-grade systematic complexity management for ambitious professionals.
            </p>
          </div>

          {/* The 6 Pillars */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">The 6 Pillars Explained</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.name} className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-gray-800">{pillar.name}</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{pillar.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-green-900">How GoalMine.ai's Platform Works</h3>
            <div className="space-y-3 text-green-800">
              <p><strong>1. AI Assessment:</strong> Intelligent system captures your current and desired state across all life domains</p>
              <p><strong>2. Gap Analysis:</strong> Advanced algorithms identify priority areas for maximum life transformation</p>
              <p><strong>3. Strategic Architecture:</strong> AI generates personalized goals based on your unique complexity patterns</p>
              <p><strong>4. Time Optimization:</strong> Platform helps allocate weekly hours across domains for optimal balance</p>
              <p><strong>5. Progress Intelligence:</strong> Real-time analytics and AI coaching maintain momentum and adjust strategies</p>
            </div>
          </div>

          {/* Business Happiness Formula */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-amber-900">Plus: The Business Happiness Formula™</h3>
            <p className="text-amber-800 leading-relaxed mb-3">
              GoalMine.ai's proprietary Business Happiness Formula identifies the core drivers of professional satisfaction: 
              <strong> impact, fun, compensation, and flexibility (location/schedule).</strong> Our platform's intelligent assessment captures 
              your unique weighting of these variables to optimize career fulfillment.
            </p>
            <p className="text-amber-800 leading-relaxed">
              This specialized framework works within the Work pillar to provide granular professional optimization, 
              ensuring not just career advancement but genuine workplace satisfaction aligned with your personal values and lifestyle preferences.
            </p>
          </div>

          {/* Why It Works */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Why GoalMine.ai's Platform Works</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Enterprise-Grade Intelligence</h4>
                <p className="text-gray-600 text-sm">Advanced AI addresses all life domains simultaneously, preventing the common trap of success in one area at the expense of others</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Personalized Architecture</h4>
                <p className="text-gray-600 text-sm">Intelligent algorithms analyze your complexity patterns to reveal where you should focus energy for maximum life transformation</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Optimized Resource Allocation</h4>
                <p className="text-gray-600 text-sm">Platform-assisted time allocation across domains based on your personal definitions, priorities, and constraints</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Proven Methodologies</h4>
                <p className="text-gray-600 text-sm">30 years of framework refinement scaled through AI for thousands of ambitious professionals managing complex lives</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center pt-4 border-t">
            <p className="text-gray-600 mb-4">Ready to transform your life's complexities into strategic clarity?</p>
            <Button onClick={onClose} className="bg-primary hover:bg-primary-hover">
              <Target className="w-4 h-4 mr-2" />
              Start Your Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};