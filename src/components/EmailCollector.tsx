import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
interface EmailCollectorProps {
  onEmailSubmit: (email: string) => void;
  onBack: () => void;
}
export const EmailCollector = ({
  onEmailSubmit,
  onBack
}: EmailCollectorProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    onEmailSubmit(email);
    setIsSubmitting(false);
  };
  return <div className="min-h-screen bg-background">
      <Header onLogoClick={() => window.location.href = '/?home=true'} />
      <div className="flex items-center justify-center px-6 pt-8">
        <div className="container mx-auto max-w-md">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ready to create your Goal?</CardTitle>
            <p className="text-muted-foreground mt-2">Enter your email to begin your 30-day free trial and receive your powerful daily wake-up call.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="text-lg h-12" required />
              </div>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={!email || !email.includes("@") || isSubmitting} className="flex-1 bg-primary hover:bg-primary-hover">
                  {isSubmitting ? <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Continue
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                We'll send your daily wake-up call to this email. 
                <br />
                No spam, unsubscribe anytime.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>;
};