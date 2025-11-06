import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Disclaimer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900">Important Disclaimer</h1>
          </div>
          <p className="text-sm text-gray-600 mb-8">Effective Date: November 6, 2025</p>

          <div className="prose prose-lg max-w-none">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">Please Read Carefully</h2>
              <p className="text-amber-700">
                This disclaimer outlines important limitations about GoalMine.ai's services. 
                By using our platform, you acknowledge and agree to these limitations.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Not Professional Therapy or Counseling</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>We are not licensed therapists, counselors, psychologists, or mental health professionals</strong></li>
                  <li><strong>GoalMine.ai is not a substitute for professional mental health treatment</strong></li>
                  <li><strong>Our AI-powered coaching is for motivational and organizational purposes only</strong></li>
                  <li><strong>If you're experiencing mental health issues, please consult with a licensed professional</strong></li>
                </ul>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">Crisis Resources:</p>
                <ul className="text-blue-700 mt-2 space-y-1">
                  <li><strong>Suicide & Crisis Lifeline:</strong> 988 (US)</li>
                  <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                  <li><strong>Emergency Services:</strong> 911 (US) or your local emergency number</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Not Financial or Professional Advice</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>No Financial Advice:</strong> We do not provide financial, investment, tax, or legal advice</li>
                <li><strong>No Professional Guidance:</strong> Career suggestions are general motivation, not professional consulting</li>
                <li><strong>No Investment Recommendations:</strong> Any mention of financial topics is educational only</li>
                <li><strong>Consult Professionals:</strong> For financial, legal, or career decisions, consult qualified professionals</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Content Limitations</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Motivational Purpose Only:</strong> AI content is designed for inspiration and organization, not professional advice</li>
                  <li><strong>No Accuracy Guarantee:</strong> AI may generate inaccurate, inappropriate, or irrelevant suggestions</li>
                  <li><strong>Not Personalized Medicine:</strong> Health and fitness suggestions are general motivation, not medical advice</li>
                  <li><strong>Human Oversight Required:</strong> Always use your judgment and consult professionals for important decisions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Responsibility</h2>
              <p className="text-gray-700 mb-4">
                By using GoalMine.ai, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>You are responsible for your own decisions</strong> and the consequences of actions you take</li>
                <li><strong>You will use the platform appropriately</strong> for personal life organization and motivation</li>
                <li><strong>You will seek professional help</strong> for serious mental health, financial, or medical concerns</li>
                <li><strong>You understand the limitations</strong> of AI-generated content and coaching</li>
                <li><strong>You will not rely solely on our platform</strong> for major life decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Health and Fitness Disclaimer</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Not Medical Advice:</strong> Health and fitness suggestions are for motivational purposes only</li>
                <li><strong>Consult Your Doctor:</strong> Always consult healthcare professionals before starting new fitness routines</li>
                <li><strong>Know Your Limits:</strong> Exercise within your abilities and medical restrictions</li>
                <li><strong>Individual Results Vary:</strong> Health outcomes depend on many personal factors</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Guarantee of Results</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>No Success Guarantee:</strong> We cannot guarantee you will achieve your goals or desired outcomes</li>
                  <li><strong>Individual Effort Required:</strong> Success depends on your commitment, circumstances, and actions</li>
                  <li><strong>External Factors:</strong> Many factors beyond our control affect goal achievement</li>
                  <li><strong>Platform Purpose:</strong> We provide tools and motivation; you provide the action</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Limitations</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Technology Limitations:</strong> AI and software have inherent limitations and may malfunction</li>
                <li><strong>Internet Dependency:</strong> Service requires internet connection and may be unavailable</li>
                <li><strong>Continuous Development:</strong> Features may change, be updated, or discontinued</li>
                <li><strong>User Error:</strong> Incorrect use of the platform may lead to poor outcomes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Age and Capacity Requirements</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Minimum Age:</strong> You must be at least 18 years old to use GoalMine.ai</li>
                <li><strong>Legal Capacity:</strong> You must have the legal capacity to enter into agreements</li>
                <li><strong>Parental Supervision:</strong> Minors should not use this platform without adult supervision</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions or Concerns</h2>
              <p className="text-gray-700">
                If you have questions about this disclaimer or our services, please contact us at:
              </p>
              <ul className="list-none text-gray-700 mt-4 space-y-1">
                <li><strong>Email:</strong> support@goalmine.ai</li>
                <li><strong>Address:</strong> GoalMine.ai Support Team</li>
              </ul>
              <p className="text-gray-700 mt-4 italic">
                Remember: When in doubt, consult with qualified professionals. Your wellbeing is our priority.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};