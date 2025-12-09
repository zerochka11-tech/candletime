import { supabase } from './supabaseClient';

/**
 * Проверка прав администратора
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: any | null;
  error: string | null;
}> {
  try {
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
    const isAdmin = adminEmails.includes(user.email || '');

    return {
      isAdmin,
      user: isAdmin ? user : null,
      error: isAdmin ? null : 'Access denied',
    };
  } catch (error: any) {
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

