import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, anonKey);

    const { username, password } = await req.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password required' }), { status: 400, headers: corsHeaders });
    }

    // Look up email from profiles
    const { data: profile } = await adminClient.from('profiles').select('user_id').eq('username', username).maybeSingle();
    
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401, headers: corsHeaders });
    }

    // Get user email from auth
    const { data: { user } } = await adminClient.auth.admin.getUserById(profile.user_id);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401, headers: corsHeaders });
    }

    // Sign in with email/password
    const { data: session, error } = await anonClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ session: session.session, user: session.user }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
