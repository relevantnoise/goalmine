import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Test from "./pages/Test";
import Auth from "./pages/Auth";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import GoalDetail from "./pages/GoalDetail";
import VerifyEmail from "./pages/VerifyEmail";
import { UpgradePage } from "./pages/UpgradePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/test" element={<Test />} />
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/goal/:goalId" element={<GoalDetail />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/success" element={<Success />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
