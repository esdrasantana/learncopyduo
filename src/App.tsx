import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StudyDataProvider } from "@/hooks/useStudyData";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Sessions from "@/pages/Sessions";
import TimerPage from "@/pages/TimerPage";
import DaysPage from "@/pages/DaysPage";
import MedalsPage from "@/pages/MedalsPage";
import GoalsPage from "@/pages/GoalsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-gradient-primary">StudyOS</h1>
          <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/days" element={<DaysPage />} />
        <Route path="/medals" element={<MedalsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudyDataProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </StudyDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
