import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://ddhqmsszumyyabkvmpqh.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4';

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  supabaseAnonKey;

/**
 * Cria um cliente Supabase com a identidade e permissões do usuário logado (JWT).
 * Isso permite que o PostgreSQL aplique as regras de RLS (Row Level Security) e
 * identifique auth.uid() em triggers como trg_concessions_approved_by.
 */
export function createUserSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
