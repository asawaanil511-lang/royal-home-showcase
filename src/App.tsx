import { Suspense, lazy } from "react";
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
import { Analytics } from "@vercel/analytics/react";
import WalletAnimation from "./components/WalletAnimation";
import ChangePasswordDialog from "./components/ChangePasswordDialog";

// Eagerly load pages that are likely the first interaction
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Rules from "./pages/Rules";

// Lazy load heavier pages — only fetched when the user navigates there
const Index = lazy(() => import("./pages/Index"));
const Wallet = lazy(() => import("./pages/Wallet"));
const MyBets = lazy(() => import("./pages/MyBets"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Results = lazy(() => import("./pages/Results"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // consider data fresh for 30 s — fewer background refetches
      gcTime: 5 * 60_000,      // keep unused cache for 5 min
      retry: 1,                // only 1 retry on failure (default 3 is too aggressive on mobile)
      refetchOnWindowFocus: false, // don't hammer the server when user switches tabs
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>

            {/* Mobile bottom navigation */}
            <BottomNav />
          </AuthProvider>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
