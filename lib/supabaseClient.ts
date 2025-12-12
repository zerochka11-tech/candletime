import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Валидация переменных окружения
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
  // В production используем placeholder, но логируем предупреждение
  console.warn(
    'Supabase environment variables are missing. The application may not work correctly.'
  );
}

// Один общий клиент, который будем переиспользовать в приложении
// ВАЖНО: Убедись, что переменные окружения установлены в Vercel:
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    // Оптимизация для быстрой загрузки
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    // Отключаем автоматическое подключение к Realtime
    // Realtime будет использоваться только при явной подписке через .channel()
    global: {
      headers: {
        'x-client-info': 'candletime-web',
      },
    },
  }
);
