// Zero-dependency Supabase REST Client
const DEFAULT_SUPABASE_URL = 'https://johritywawttreelxbiz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_QAbwClQwQuuIyYnJ-RKI4A_5yoCQ9uv';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

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
      if (!res.ok) {
        return { data: null, error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async upsert(table, payload) {
    if (!isSupabaseConfigured) return { data: null, error: 'Not configured' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async patch(table, query, payload) {
    if (!isSupabaseConfigured) return { data: null, error: 'Not configured' };
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        method: 'PATCH',
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
