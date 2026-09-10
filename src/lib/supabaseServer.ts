import { createClient } from '@supabase/supabase-js';

// No servidor Next.js / Vercel, usamos variáveis de ambiente puras (sem prefixo NEXT_PUBLIC_)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://ddhqmsszumyyabkvmpqh.supabase.co';

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaHFtc3N6dW15eWFia3ZtcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjg5MzMsImV4cCI6MjEwNDY0NDkzM30.aKNFJtmdjiRzeq0dJE7p0MJ7ewANr8c0vz6R_uj1rO4';

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
