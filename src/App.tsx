import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { useNotifications } from "@/hooks/useNotifications";
import Index from "./pages/Index";
import Matches from "./pages/Matches";
import Wallet from "./pages/Wallet";
import MyBets from "./pages/MyBets";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import Rules from "./pages/Rules";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import WalletAnimation from "./components/WalletAnimation";
import ChangePasswordDialog from "./components/ChangePasswordDialog";

const queryClient = new QueryClient();

const PasswordGate = () => {
  const { user, mustChangePassword } = useAuth();
  if (!user || !mustChangePassword) return null;
  return <ChangePasswordDialog open={true} userId={user.id} />;
};

const NotificationGate = () => {
  const { user } = useAuth();
  useNotifications(user?.id);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WalletAnimation />
            <PasswordGate />
            <NotificationGate />
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/rules" element={<Rules />} />

              {/* Protected — redirect to /login if not authenticated */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/my-bets" element={<ProtectedRoute><MyBets /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

              {/* Legacy register → login */}
              <Route path="/register" element={<Navigate to="/login" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Mobile bottom navigation */}
            <BottomNav />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
