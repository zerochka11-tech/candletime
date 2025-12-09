'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ThemeToggle';
import { checkAdminAccess } from '@/lib/admin';

type UserInfo = {
  email: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Функция закрытия меню
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Закрытие меню при изменении пути
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Закрытие меню при изменении размера экрана (если стало больше md)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeMobileMenu]);

  // Закрытие меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Блокируем скролл body при открытом меню
      document.body.style.overflow = 'hidden';
      // Добавляем класс для отключения взаимодействия с картой
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.style.overflow = '';
      // Удаляем класс при закрытии меню
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen, closeMobileMenu]);

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

    // Проверка прав администратора
    const checkAdmin = async () => {
      const { isAdmin: admin } = await checkAdminAccess();
      setIsAdmin(admin);
    };
    checkAdmin();

    // Подписка на изменения авторизации — мгновенно обновляем UI
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser({ email: session?.user.email ?? null });
        showNotice('Вы вошли в аккаунт');
        // Проверяем права после входа
        const { isAdmin: admin } = await checkAdminAccess();
        setIsAdmin(admin);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
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
    <>
      <header className="sticky top-0 z-30 border-b border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm transition-colors duration-200">
        <div className="relative">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-indigo-500/3 dark:from-amber-500/5 dark:to-indigo-500/5" />
          
          <nav className="relative mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          {/* Логотип / название */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 transition-transform hover:-translate-y-0.5 flex-shrink-0"
            onClick={closeMobileMenu}
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
            <Link
              href="/faq"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${isActive('/faq')} ${pathname === '/faq' || pathname.startsWith('/faq/') ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'}`}
            >
              FAQ
            </Link>
            <Link
              href="/map"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${isActive('/map')} ${pathname === '/map' ? 'bg-slate-100 dark:bg-slate-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'}`}
            >
              Карта
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
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
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

      {/* Мобильное меню (полноэкранное) - вне header для правильного z-index */}
      <div
        className={`fixed inset-0 z-[9999] md:hidden bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-full pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
            <div
              id="mobile-menu"
              className="flex flex-col h-full w-full"
              role="menu"
              aria-label="Мобильное меню"
            >
            {/* Заголовок с крестиком */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-xs shadow-md">
                  <span className="h-3 w-2 rounded-full bg-amber-300 shadow-sm" />
                </span>
                <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  CandleTime
                </span>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                aria-label="Закрыть меню"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент меню с прокруткой */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl px-4 py-6 space-y-2">
                <Link
                  href="/light"
                  onClick={closeMobileMenu}
                  role="menuitem"
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                    pathname === '/light'
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-900 dark:text-amber-100 shadow-md border border-amber-200/50 dark:border-amber-700/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">🕯️</span>
                  <span className="flex-1">Зажечь</span>
                  {pathname === '/light' && (
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>

                <Link
                  href="/candles"
                  onClick={closeMobileMenu}
                  role="menuitem"
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                    pathname === '/candles'
                      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-900 dark:text-indigo-100 shadow-md border border-indigo-200/50 dark:border-indigo-700/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">👁️</span>
                  <span className="flex-1">Свечи</span>
                  {pathname === '/candles' && (
                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>

                <Link
                  href="/faq"
                  onClick={closeMobileMenu}
                  role="menuitem"
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                    pathname === '/faq' || pathname.startsWith('/faq/')
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-900 dark:text-purple-100 shadow-md border border-purple-200/50 dark:border-purple-700/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">📚</span>
                  <span className="flex-1">FAQ</span>
                  {(pathname === '/faq' || pathname.startsWith('/faq/')) && (
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>

                <Link
                  href="/map"
                  onClick={closeMobileMenu}
                  role="menuitem"
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                    pathname === '/map'
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-900 dark:text-blue-100 shadow-md border border-blue-200/50 dark:border-blue-700/50'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110">🌍</span>
                  <span className="flex-1">Карта</span>
                  {pathname === '/map' && (
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>

                {user && (
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    role="menuitem"
                    className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                      pathname === '/dashboard'
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-900 dark:text-emerald-100 shadow-md border border-emerald-200/50 dark:border-emerald-700/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">📋</span>
                    <span className="flex-1">Мои свечи</span>
                    {pathname === '/dashboard' && (
                      <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin/articles"
                    onClick={closeMobileMenu}
                    role="menuitem"
                    className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-200 min-h-[56px] active:scale-[0.98] ${
                      pathname.startsWith('/admin')
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-900 dark:text-amber-100 shadow-md border border-amber-200/50 dark:border-amber-700/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">🔐</span>
                    <span className="flex-1">Админ-панель</span>
                    {pathname.startsWith('/admin') && (
                      <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                )}

              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
