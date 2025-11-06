import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Test from "./pages/Test";
import { ProtectedAuth } from "./components/ProtectedAuth";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import GoalDetail from "./pages/GoalDetail";
import VerifyEmail from "./pages/VerifyEmail";
import { UpgradePage } from "./pages/UpgradePage";
import { SetupDatabase } from "./pages/SetupDatabase";
import { EditFrameworkPage } from "./components/EditFrameworkPage";
import { Methodology } from "./pages/Methodology";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { Disclaimer } from "./pages/Disclaimer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/test" element={<Test />} />
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/auth" element={<ProtectedAuth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/goal/:goalId" element={<GoalDetail />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/setup-database" element={<SetupDatabase />} />
            <Route path="/edit-framework" element={<EditFrameworkPage onComplete={() => window.location.href = '/'} onCancel={() => window.location.href = '/'} />} />
            <Route path="/success" element={<Success />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
