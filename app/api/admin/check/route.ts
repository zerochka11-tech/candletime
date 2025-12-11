import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * API endpoint для проверки прав администратора текущего пользователя
 * Используется как fallback, если Server Component не работает
 * Проверяет сессию через cookies или Bearer token
 * 
 * @param request - Next.js request объект
 * @returns JSON с результатом проверки: isAdmin (boolean), user (объект пользователя или null), error (строка или null)
 * 
 * @example
 * GET /api/admin/check
 * 
 * Response:
 * {
 *   "isAdmin": true,
 *   "user": { "email": "admin@example.com" }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Находим cookie с сессией Supabase
    const allCookies = cookieStore.getAll();
    const supabaseCookie = allCookies.find((cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );

    if (!supabaseCookie) {
      return NextResponse.json({ isAdmin: false, error: 'No session' }, { status: 401 });
    }

    // Парсим JSON из cookie
    let sessionData: any;
    try {
      sessionData = JSON.parse(supabaseCookie.value);
    } catch (parseError) {
      return NextResponse.json({ isAdmin: false, error: 'Invalid session' }, { status: 401 });
    }

    const accessToken = sessionData?.access_token || sessionData?.token;

    if (!accessToken) {
      return NextResponse.json({ isAdmin: false, error: 'No token' }, { status: 401 });
    }

    // Создаем Supabase клиент для проверки токена
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Проверяем токен и получаем пользователя
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, является ли пользователь админом
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const normalizedAdminEmails = adminEmails.map((email) => email.trim().toLowerCase());
    const isAdmin = normalizedAdminEmails.includes((user.email || '').toLowerCase());

    return NextResponse.json({ isAdmin, user: isAdmin ? { email: user.email } : null });
  } catch (error: any) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

