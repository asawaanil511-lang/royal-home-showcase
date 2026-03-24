import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminBets from "@/components/admin/AdminBets";
import AdminUserManagement from "@/components/admin/AdminUserManagement";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    if (!user) { navigate("/login"); return; }
    const checkRole = async () => {
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setChecking(false);
    };
    checkRole();
  }, [user, authLoading]);

  if (authLoading || checking || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2 mb-6">
          <Shield className="h-7 w-7 text-primary" /> Admin Panel
        </h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-secondary border border-border/50 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bets">Bets</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
          <TabsContent value="matches"><AdminMatches /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="bets"><AdminBets /></TabsContent>
        </Tabs>
      </section>
      <Footer />
    </div>
  );
};

export default Admin;
