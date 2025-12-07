import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Один общий клиент, который будем переиспользовать в приложении
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
