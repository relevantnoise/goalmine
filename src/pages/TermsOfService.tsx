import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Effective Date: November 6, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using GoalMine.ai, you agree to be bound by these Terms of Service and our Privacy Policy. 
                If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 mb-4">
                GoalMine.ai is a life optimization platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>6 Pillars of Life™ Framework assessment and tracking</li>
                <li>AI-powered goal creation and daily motivation</li>
                <li>Progress tracking and personalized insights</li>
                <li>Business Happiness Formula™ optimization tools</li>
                <li>Daily motivation emails and check-in reminders</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
              <p className="text-gray-700 mb-4">When using GoalMine.ai, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Provide Accurate Information:</strong> Give honest, accurate responses in assessments and goal creation</li>
                <li><strong>Use Appropriately:</strong> Use the platform for personal life optimization purposes only</li>
                <li><strong>Maintain Security:</strong> Keep your account credentials secure and notify us of unauthorized access</li>
                <li><strong>Respect Others:</strong> If sharing any content, ensure it's respectful and appropriate</li>
                <li><strong>Follow Laws:</strong> Comply with all applicable local, state, and federal laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-800 font-medium">Important Legal Protection:</p>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>AI-Generated Content:</strong> We are not responsible for the accuracy, effectiveness, or outcomes of AI-generated advice, suggestions, or motivational content</li>
                <li><strong>Goal Achievement:</strong> We make no guarantees that you will achieve your goals or desired life outcomes</li>
                <li><strong>Security Breaches:</strong> While we implement strong security measures, we are not liable for unauthorized access due to circumstances beyond our reasonable control</li>
                <li><strong>Service Interruptions:</strong> We are not responsible for temporary unavailability, downtime, or technical issues</li>
                <li><strong>Third-Party Services:</strong> We are not liable for issues with third-party services (payment processors, email providers, etc.)</li>
                <li><strong>Maximum Liability:</strong> Our total liability to you for any claims is limited to the amount you paid us in the 12 months prior to the claim</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Availability</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>"As-Is" Basis:</strong> GoalMine.ai is provided on an "as-is" and "as-available" basis</li>
                <li><strong>No Uptime Guarantee:</strong> We strive for high availability but don't guarantee uninterrupted service</li>
                <li><strong>Maintenance:</strong> We may temporarily suspend service for updates, maintenance, or improvements</li>
                <li><strong>Feature Changes:</strong> We may modify, update, or discontinue features with reasonable notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Terms</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Free Plan:</strong> Permanent free access with 1 goal and basic features</li>
                <li><strong>Billing:</strong> Paid plans are billed monthly or annually in advance</li>
                <li><strong>Cancellation:</strong> You may cancel your subscription at any time; service continues until the end of your billing period</li>
                <li><strong>Refunds:</strong> Generally no refunds for partial months, but we'll consider special circumstances</li>
                <li><strong>Price Changes:</strong> We may change subscription prices with 30 days' notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Termination</h2>
              <p className="text-gray-700 mb-4">We reserve the right to suspend or terminate accounts for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of our platform or staff</li>
                <li>Non-payment of subscription fees</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You may delete your account at any time through your account settings or by contacting support.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Our Content:</strong> GoalMine.ai, 6 Pillars of Life™, Business Happiness Formula™, and all platform content are our intellectual property</li>
                <li><strong>Your Content:</strong> You retain rights to your personal data, goals, and assessment responses</li>
                <li><strong>License:</strong> You grant us a limited license to use your data to provide our service</li>
                <li><strong>Restrictions:</strong> You may not copy, modify, distribute, or reverse engineer our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these Terms of Service periodically. We'll notify you of significant changes via email 
                or prominent notice on our platform at least 30 days before they take effect. 
                Continued use after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700">
                These Terms of Service are governed by the laws of the State of Delaware, United States. 
                Any disputes will be resolved in the courts of Delaware, and you consent to personal jurisdiction there.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none text-gray-700 mt-4 space-y-1">
                <li><strong>Email:</strong> support@goalmine.ai</li>
                <li><strong>Address:</strong> GoalMine.ai Legal Team</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};