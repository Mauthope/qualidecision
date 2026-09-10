import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcncdxjflyhbhzdyclrb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbmNkeGpmbHloYmh6ZHljbHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzkzMzgsImV4cCI6MjEwNDU1NTMzOH0.ZuGjXfE0-DfDjMQyFPkaZVoatyoGahJux82bYtzzLRY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
