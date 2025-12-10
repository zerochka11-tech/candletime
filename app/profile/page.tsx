'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess } from '@/lib/admin';

type UserStats = {
  totalCandles: number;
  activeCandles: number;
  candlesLast30Days: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ 
    email: string | null; 
    createdAt: string | null;
    id: string | null;
  } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Таймаут для всего запроса (15 секунд)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile loading timeout')), 15000)
        );

        const loadPromise = (async () => {
          const { data: authData, error } = await supabase.auth.getUser();
          
          if (error || !authData.user) {
            router.push('/auth/login');
            return;
          }

          setUser({
            email: authData.user.email ?? null,
            createdAt: authData.user.created_at ?? null,
            id: authData.user.id ?? null,
          });

          // Загружаем статистику
          const userId = authData.user.id;
          const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          const nowIso = new Date().toISOString();
          
          const [totalResult, activeResult, recentResult] = await Promise.all([
            supabase
              .from('candles')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId),
            supabase
              .from('candles')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .neq('status', 'extinguished')
              .gt('expires_at', nowIso),
            supabase
              .from('candles')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .gte('created_at', thirtyDaysAgo),
          ]);

          // Обрабатываем ошибки для каждого запроса
          if (totalResult.error) {
            console.error('[Profile] Error loading total candles:', totalResult.error);
          }
          if (activeResult.error) {
            console.error('[Profile] Error loading active candles:', activeResult.error);
          }
          if (recentResult.error) {
            console.error('[Profile] Error loading recent candles:', recentResult.error);
          }

          setStats({
            totalCandles: totalResult.count ?? 0,
            activeCandles: activeResult.count ?? 0,
            candlesLast30Days: recentResult.count ?? 0,
          });

          // Проверяем права администратора (не блокируем загрузку при ошибке)
          try {
            const { isAdmin: admin } = await checkAdminAccess();
            setIsAdmin(admin);
          } catch (adminError) {
            console.error('[Profile] Error checking admin access:', adminError);
            setIsAdmin(false);
          }
        })();

        await Promise.race([loadPromise, timeoutPromise]);
      } catch (error: any) {
        console.error('[Profile] Error loading profile:', error);
        // Не перенаправляем на логин при таймауте, просто показываем ошибку
        if (!error.message?.includes('timeout')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
          <div className="space-y-3 sm:space-y-4">
            <div className="h-5 w-28 sm:h-6 sm:w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-40 sm:w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-32 sm:w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
          Мой профиль
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
          Управление аккаунтом и просмотр статистики
        </p>
      </header>

      {/* Информация о пользователе */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-4 sm:space-y-5">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            Информация о пользователе
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 break-all">
                {user.email || '—'}
              </p>
            </div>

            {user.createdAt && (
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Дата регистрации
                </label>
                <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Статистика */}
      {stats && (
        <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 dark:from-amber-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  🕯️
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Всего свечей
                </p>
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalCandles}
                </p>
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  За всё время
                </span>
              </div>
            </div>
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  🔥
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Активные свечи
                </p>
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.activeCandles}
                </p>
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Сейчас горят
                </span>
              </div>
            </div>
          </div>

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 text-base sm:text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                  ✨
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  За последние 30 дней
                </p>
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.candlesLast30Days}
                </p>
                <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Зажжено свечей
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Админ-панель (только для админов) */}
      {isAdmin && (
        <section className="relative overflow-hidden rounded-3xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-900/20 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-xl shadow-sm">
                🔐
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                  Админ-панель
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Управление контентом и статьями
                </p>
              </div>
            </div>
            <Link
              href="/admin/articles"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold text-amber-900 dark:text-amber-100 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500 dark:hover:border-amber-500 hover:from-amber-200 hover:to-amber-100 dark:hover:from-amber-900/50 dark:hover:to-amber-800/30 hover:shadow-lg min-h-[48px] sm:min-h-0 w-full sm:w-auto"
            >
              <span>📝</span>
              <span>Управление статьями</span>
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Быстрые ссылки */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            Быстрые ссылки
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-h-[44px] sm:min-h-0"
            >
              <span>📋</span>
              <span>Мои свечи</span>
            </Link>
            <Link
              href="/light"
              className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-h-[44px] sm:min-h-0"
            >
              <span>🕯️</span>
              <span>Зажечь свечу</span>
            </Link>
            <Link
              href="/candles"
              className="group inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-h-[44px] sm:min-h-0"
            >
              <span>👁️</span>
              <span>Все свечи</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Кнопка выхода */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-full border border-red-300 dark:border-red-600 bg-white dark:bg-slate-800 px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-medium text-red-700 dark:text-red-400 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-lg min-h-[48px] sm:min-h-0"
          >
            Выйти из аккаунта
          </button>
        </div>
      </section>
    </div>
  );
}

