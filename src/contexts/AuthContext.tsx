import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const prevBalanceRef = useRef<number | null>(null);

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          prevBalanceRef.current = null;
          setMustChangePassword(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
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
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, walletChange, mustChangePassword, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
