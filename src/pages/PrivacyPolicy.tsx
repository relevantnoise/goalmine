import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Effective Date: November 6, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Privacy Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At GoalMine.ai, we understand you're sharing deeply personal information about your life goals and happiness. 
                <strong> We will never sell, rent, or share your personal information with third parties for marketing purposes.</strong> Your trust is fundamental to our mission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, authentication data</li>
                <li><strong>Assessment Data:</strong> Your 6 Pillars Framework responses and life satisfaction ratings</li>
                <li><strong>Goals & Progress:</strong> Goals you create, check-ins, streaks, and motivation preferences</li>
                <li><strong>Usage Data:</strong> How you interact with our platform to improve your experience</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store card details)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Personalization:</strong> Generate AI-powered coaching and insights tailored to your goals</li>
                <li><strong>Service Delivery:</strong> Send daily motivation emails and track your progress</li>
                <li><strong>Platform Improvement:</strong> Analyze anonymized usage patterns to enhance our features</li>
                <li><strong>Account Management:</strong> Process payments, provide customer support, send important updates</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>We do not:</strong> Sell your data, use it for advertising, or share it with data brokers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Protection & Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on enterprise-grade cloud platforms (Supabase, Vercel)</li>
                <li><strong>Access Controls:</strong> Strict employee access controls and regular security audits</li>
                <li><strong>Regular Backups:</strong> Automatic data backups to prevent loss</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-700 mb-4">We work with trusted partners to provide our service:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Supabase:</strong> Secure database hosting and authentication</li>
                <li><strong>OpenAI:</strong> AI-powered coaching content (data processed securely, not used for training)</li>
                <li><strong>Stripe:</strong> Payment processing (PCI-compliant, secure)</li>
                <li><strong>Resend:</strong> Email delivery for daily motivation</li>
                <li><strong>Firebase:</strong> Authentication and user management</li>
              </ul>
              <p className="text-gray-700 mt-4">
                These partners are contractually bound to protect your data and use it only for providing our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Data Rights</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of all data we have about you</li>
                <li><strong>Correction:</strong> Update or correct any inaccurate information</li>
                <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from emails at any time</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, contact us at <strong>support@goalmine.ai</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                <li><strong>Inactive Accounts:</strong> Data deleted after 2 years of inactivity</li>
                <li><strong>Deleted Accounts:</strong> All personal data permanently deleted within 30 days</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                We'll notify you of significant changes via email or prominent notice on our platform. 
                Continued use of GoalMine.ai after updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <ul className="list-none text-gray-700 mt-4 space-y-1">
                <li><strong>Email:</strong> support@goalmine.ai</li>
                <li><strong>Address:</strong> GoalMine.ai Privacy Team</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};