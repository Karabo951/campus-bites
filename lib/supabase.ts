import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://dhkxzponbhjdydpeqakz.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoa3h6cG9uYmhqZHlkcGVxYWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzY5NzYsImV4cCI6MjEwMzc1Mjk3Nn0.IbGVZCh3McGbHwnVU3FvZC8X8svuAm2t_tLGP0k842Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);