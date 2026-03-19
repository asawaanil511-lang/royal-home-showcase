
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can view all roles, users can view their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_name TEXT NOT NULL,
  team_b_name TEXT NOT NULL,
  team_a_logo TEXT,
  team_b_logo TEXT,
  odds_a NUMERIC NOT NULL DEFAULT 1.90,
  odds_b NUMERIC NOT NULL DEFAULT 1.90,
  max_bet NUMERIC NOT NULL DEFAULT 10000,
  match_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Everyone can read matches
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bets table
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  team_picked TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  odds NUMERIC NOT NULL,
  potential_win NUMERIC NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets" ON public.bets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bets" ON public.bets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can place bets" ON public.bets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update bets" ON public.bets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coin flips table
CREATE TABLE public.coin_flips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bet_amount NUMERIC NOT NULL,
  chosen_side TEXT NOT NULL,
  result_side TEXT NOT NULL,
  won BOOLEAN NOT NULL,
  payout NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_flips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flips" ON public.coin_flips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert flips" ON public.coin_flips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all flips" ON public.coin_flips FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger for matches
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
