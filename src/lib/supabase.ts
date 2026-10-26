import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.warn(
    '[FareFair] Supabase URL is not configured. ' +
      'Set VITE_SUPABASE_URL in your .env file.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.warn(
    '[FareFair] Supabase Anon Key is not configured. ' +
      'Set VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    supabaseUrl !== 'your_supabase_project_url' &&
    !!supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key'
  );
};
