// Zero-dependency Supabase REST Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseApi = {
  async get(table, query = '') {
    if (!isSupabaseConfigured) return { data: null, error: 'Not configured' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async post(table, payload) {
    if (!isSupabaseConfigured) return { data: null, error: 'Not configured' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
