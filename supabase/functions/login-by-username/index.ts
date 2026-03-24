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
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { username } = await req.json();
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), { status: 400, headers: corsHeaders });
    }

    // Look up email from profiles
    const { data: profile } = await adminClient.from('profiles').select('user_id').eq('username', username).maybeSingle();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Invalid username' }), { status: 404, headers: corsHeaders });
    }

    // Get user email from auth
    const { data: { user } } = await adminClient.auth.admin.getUserById(profile.user_id);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ email: user.email }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
