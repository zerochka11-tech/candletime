'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ThemeToggle';

type UserInfo = {
  email: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let timeoutId: any;

    const showNotice = (msg: string) => {
      setAuthNotice(msg);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setAuthNotice(null), 3000);
    };

    const loadUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setUser(null);
        } else {
          setUser({ email: data.user.email ?? null });
        }
      } catch (e) {
        console.error('auth getUser error', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Подписка на изменения авторизации — мгновенно обновляем UI
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser({ email: session?.user.email ?? null });
        showNotice('Вы вошли в аккаунт');
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        showNotice('Вы вышли из аккаунта');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const isActive = (href: string) =>
    pathname === href
      ? 'text-slate-900 dark:text-slate-100'
      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="relative">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-indigo-500/3 dark:from-amber-500/5 dark:to-indigo-500/5" />
        
        <nav className="relative mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          {/* Логотип / название */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 transition-transform hover:-translate-y-0.5 flex-shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-xs shadow-md transition-transform duration-300 group-hover:scale-110">
              <span className="h-3 w-2 rounded-full bg-amber-300 shadow-sm" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-base">
              CandleTime
            </span>
          </Link>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 text-sm">
            <Link
              href="/light"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${isActive('/light')} ${pathname === '/light' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'}`}
            >
              Зажечь
            </Link>
            <Link
              href="/candles"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${isActive('/candles')} ${pathname === '/candles' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'}`}
            >
              Свечи
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${isActive(
                  '/dashboard'
                )} ${pathname === '/dashboard' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'}`}
              >
                Мои свечи
              </Link>
            )}

            {/* Переключатель темы */}
            <ThemeToggle />

            {/* Правая часть: логин / пользователь */}
            {loading ? (
              <div className="ml-1 h-7 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : user ? (
              <Link
                href="/profile"
                title="Мой профиль"
                className={`ml-1 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg ${pathname === '/profile' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : ''}`}
              >
                Мой профиль
              </Link>
            ) : (
              <Link
                href="/auth/login"
                title="Войти в аккаунт или зарегистрироваться"
                className="ml-1 whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg"
              >
                Войти / Регистрация
              </Link>
            )}
          </div>

          {/* Мобильная навигация: кнопка бургер-меню + профиль/вход */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Переключатель темы (всегда видим) */}
            <ThemeToggle />

            {/* Кнопка профиля/входа (всегда видима) */}
            {loading ? (
              <div className="h-7 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : user ? (
              <Link
                href="/profile"
                title="Мой профиль"
                className={`whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-w-[36px] min-h-[32px] flex items-center justify-center ${pathname === '/profile' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : ''}`}
              >
                👤
              </Link>
            ) : (
              <Link
                href="/auth/login"
                title="Войти"
                className="whitespace-nowrap rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg min-w-[36px] min-h-[32px] flex items-center justify-center"
              >
                Войти
              </Link>
            )}

            {/* Кнопка бургер-меню */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg"
              aria-label="Меню"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Мобильное меню (выпадающее) */}
        {mobileMenuOpen && (
          <>
            {/* Overlay для закрытия меню при клике вне его */}
            <div
              className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-30 md:hidden border-t border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <div className="mx-auto max-w-5xl px-3 py-3 space-y-1.5">
                <Link
                  href="/light"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 min-h-[44px] ${isActive('/light')} ${pathname === '/light' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="text-base">🕯️</span>
                  <span>Зажечь</span>
                </Link>
                <Link
                  href="/candles"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 min-h-[44px] ${isActive('/candles')} ${pathname === '/candles' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <span className="text-base">👁️</span>
                  <span>Свечи</span>
                </Link>
                {user && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 min-h-[44px] ${isActive('/dashboard')} ${pathname === '/dashboard' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <span className="text-base">📋</span>
                    <span>Мои свечи</span>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}

        {/* Небольшой notification-чип под хедером */}
        {authNotice && (
          <div className="pointer-events-none absolute inset-x-0 top-full flex justify-center">
            <div className="pointer-events-auto mt-1 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-50 dark:text-slate-100 shadow-md">
              {authNotice}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
