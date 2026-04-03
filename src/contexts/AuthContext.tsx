import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";

type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  must_change_password?: boolean;
};

type WalletChange = {
  amount: number;
  type: "credit" | "debit";
  timestamp: number;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  walletChange: WalletChange | null;
  mustChangePassword: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  walletChange: null,
  mustChangePassword: false,
  isAdmin: false,
  isOwner: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletChange, setWalletChange] = useState<WalletChange | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const prevBalanceRef = useRef<number | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles: string[] = (data || []).map((r: any) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsOwner(roles.includes("owner"));
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) {
      if (prevBalanceRef.current !== null && prevBalanceRef.current !== data.wallet_balance) {
        const diff = data.wallet_balance - prevBalanceRef.current;
        setWalletChange({
          amount: Math.abs(diff),
          type: diff > 0 ? "credit" : "debit",
          timestamp: Date.now(),
        });
      }
      prevBalanceRef.current = data.wallet_balance;
      setMustChangePassword(!!data.must_change_password);
    }
    setProfile(data);
  };

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user]);

  const recordSession = async (accessToken: string) => {
    try {
      const ua = navigator.userAgent;
      let browser = "Browser";
      let os = "Unknown OS";
      if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Edg")) browser = "Edge";
      if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
      else if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      const isMobile = /Android|iPhone|iPad/i.test(ua);
      const sessionToken = accessToken.slice(0, 20);
      await fetch(apiUrl("/api/sessions/record"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ browser, os, device_type: isMobile ? "Mobile" : "Desktop", session_token: sessionToken }),
      });
    } catch { }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
          if (event === "SIGNED_IN" && session.access_token) {
            recordSession(session.access_token);
          }
        } else {
          setProfile(null);
          prevBalanceRef.current = null;
          setMustChangePassword(false);
          setIsAdmin(false);
          setIsOwner(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription for profile/wallet changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as Profile;
          if (prevBalanceRef.current !== null && prevBalanceRef.current !== newData.wallet_balance) {
            const diff = newData.wallet_balance - prevBalanceRef.current;
            setWalletChange({
              amount: Math.abs(diff),
              type: diff > 0 ? "credit" : "debit",
              timestamp: Date.now(),
            });
          }
          prevBalanceRef.current = newData.wallet_balance;
          setProfile(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    prevBalanceRef.current = null;
    setMustChangePassword(false);
    setIsAdmin(false);
    setIsOwner(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, walletChange, mustChangePassword, isAdmin, isOwner, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
