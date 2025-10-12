import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DanLynnBioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DanLynnBioModal = ({ isOpen, onClose }: DanLynnBioModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">About Dan Lynn</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Professional Summary */}
          <div className="bg-green-50 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              Dan is a seasoned business leader and successful serial entrepreneur. His experience spans from senior 
              roles at Fortune 500 companies to founding several award-winning entrepreneurial ventures. His companies 
              have been recognized for Best Places to Work and Fastest Growing Technology Company awards. Dan has now 
              dedicated his career to helping entrepreneurs, business leaders, and high-performers achieve their most 
              ambitious goals through proven methodologies, strategic advisory services, and personalized coaching.
            </p>
          </div>

          {/* Key Strengths Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Strategic Advisor Plan & Business Execution Strengths</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• Strategic Goal Planning</h4>
                <p className="text-gray-600 text-sm">Expert in breaking down complex objectives into actionable, measurable milestones</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• "Right to Left" Thinking</h4>
                <p className="text-gray-600 text-sm">Proven methodology for working backwards from your end goal to create clear execution paths</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• SMART Goal Development</h4>
                <p className="text-gray-600 text-sm">Transform vague aspirations into Specific, Measurable, Achievable, Relevant, and Time-bound goals</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• Executive Accountability Systems</h4>
                <p className="text-gray-600 text-sm">Proven frameworks for maintaining momentum and overcoming business obstacles</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• Business Strategy & Execution</h4>
                <p className="text-gray-600 text-sm">Real-world experience from taking ambitious goals from strategy to successful execution</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">• Strategic Milestone Mapping</h4>
                <p className="text-gray-600 text-sm">Custom executive frameworks for tracking progress and maintaining strategic momentum</p>
              </div>
            </div>
          </div>

          {/* Professional Background */}
          <div className="border-t pt-6">
            <div className="text-center space-y-3">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-800">Education:</span> MBA, Rutgers University
              </div>
              <div className="text-gray-600">
                <span className="font-semibold text-gray-800">Fortune 500 Experience:</span> Senior roles at AT&T and ADP
              </div>
              <div className="text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">Entrepreneurial Ventures:</span> Co-Founder & CEO DigitalGrit (digital marketing technology) • Founder & CEO RelevantNoise (AI-native social media mining company) • Founder & CEO Zaptitude (developer of Good Influence, a technology that helped the ALS foundation raise an incremental $1.4M) • Founder of VerticalShift (AI and Blockchain investment company) • Founder of GoalMine.ai (AI-powered goal achievement platform) • Founder of CleverVibes.ai (AI-powered vibe-coding incubation studio) • Co-founder at Starting Point Ventures (technology investment and advisory firm)
              </div>
            </div>
          </div>

          {/* Strategic Advisor Plan Approach */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Strategic Advisor Plan Approach</h3>
            <p className="text-gray-700 leading-relaxed">
              "Every significant business achievement begins with clear strategic vision and systematic execution methodology. Through our 
              monthly strategic advisory sessions, I work with executives and entrepreneurs to not only define ambitious goals but to build the 
              frameworks and accountability systems that ensure successful execution. My Fortune 500 leadership experience combined with serial 
              entrepreneurship and 'right to left' planning methodology has helped countless business leaders transform their biggest strategic 
              aspirations into measurable, profitable reality."
            </p>
          </div>

          {/* What You'll Get */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">What You'll Get in Our Quarterly Strategic Advisor Plan Sessions</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Executive-level strategic goal assessment and business planning</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Strategic milestone mapping with executive accountability systems</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Business obstacle identification and strategic solution development</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Progress review and strategic pivoting when needed</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Executive mindset development and leadership guidance</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};