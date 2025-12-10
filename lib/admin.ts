import { supabase } from './supabaseClient';

/**
 * Проверка прав администратора
 * Не блокирует выполнение, всегда возвращает результат быстро
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: any | null;
  error: string | null;
}> {
  try {
    // Таймаут для проверки (5 секунд)
    const timeoutPromise = new Promise<{ isAdmin: boolean; user: any | null; error: string | null }>((resolve) =>
      setTimeout(() => resolve({ isAdmin: false, user: null, error: 'Timeout' }), 5000)
    );

    const checkPromise = (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return { isAdmin: false, user: null, error: 'Not authenticated' };
      }

      // Простая проверка через переменную окружения
      // В будущем можно использовать таблицу ролей в БД
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.some(email => email.trim().toLowerCase() === (user.email || '').toLowerCase());

      return {
        isAdmin,
        user: isAdmin ? user : null,
        error: isAdmin ? null : 'Access denied',
      };
    })();

    return await Promise.race([checkPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('[Admin] Error checking admin access:', error);
    return {
      isAdmin: false,
      user: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Получить токен для API запросов
 */
export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

