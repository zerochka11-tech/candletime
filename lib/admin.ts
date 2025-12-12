import { supabase } from './supabaseClient';

/**
 * Проверяет права администратора текущего пользователя
 * Использует таймаут 5 секунд для предотвращения зависаний
 * 
 * @returns Объект с результатом проверки: isAdmin (boolean), user (объект пользователя или null), error (строка или null)
 * 
 * @example
 * ```typescript
 * const { isAdmin, user } = await checkAdminAccess();
 * if (isAdmin) {
 *   // Показать админ-панель
 * }
 * ```
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: any | null;
  error: string | null;
}> {
  try {
    // Таймаут для проверки (3 секунды - уменьшено для быстрой загрузки)
    const timeoutPromise = new Promise<{ isAdmin: boolean; user: any | null; error: string | null }>((resolve) =>
      setTimeout(() => resolve({ isAdmin: false, user: null, error: 'Timeout' }), 3000)
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
 * Получает токен доступа текущей сессии для использования в API запросах
 * 
 * @returns Access token или null, если пользователь не авторизован
 * 
 * @example
 * ```typescript
 * const token = await getAuthToken();
 * if (token) {
 *   const response = await fetch('/api/admin/articles', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 */
export async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

