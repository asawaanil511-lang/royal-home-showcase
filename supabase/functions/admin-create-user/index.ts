import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PASSWORD = 'Abcd@1234';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });

    const { action, username, password, user_id } = await req.json();

    if (action === 'create') {
      if (!username) {
        return new Response(JSON.stringify({ error: 'Username required' }), { status: 400, headers: corsHeaders });
      }
      const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@lawrence.local`;
      const usePassword = DEFAULT_PASSWORD;

      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email,
        password: usePassword,
        email_confirm: true,
        user_metadata: { username, display_name: username },
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

      // Set must_change_password flag
      if (newUser.user) {
        await supabase.from('profiles').update({ must_change_password: true }).eq('user_id', newUser.user.id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user_id: newUser.user?.id, 
        username, 
        email,
        default_password: DEFAULT_PASSWORD 
      }), { headers: corsHeaders });
    }

    if (action === 'delete') {
      if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === 'reset_password') {
      if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
      const usePassword = password || DEFAULT_PASSWORD;
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: usePassword });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      // Set must_change_password flag
      await supabase.from('profiles').update({ must_change_password: true }).eq('user_id', user_id);
      return new Response(JSON.stringify({ success: true, default_password: usePassword }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
