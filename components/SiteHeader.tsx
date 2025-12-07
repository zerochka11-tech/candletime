'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type UserInfo = {
  email: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // На всякий случай мгновенно обнуляем локальный стейт
      setUser(null);
    } catch (e) {
      console.error('logout error', e);
    } finally {
      router.push('/auth/login');
    }
  };

  const isActive = (href: string) =>
    pathname === href
      ? 'text-slate-900 bg-slate-100'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="relative">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          {/* Логотип / название */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs">
              <span className="h-3 w-2 rounded-full bg-amber-300 shadow-sm" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              CandleTime
            </span>
          </Link>

          {/* Навигация */}
          <div className="flex items-center gap-3 text-xs md:text-sm">
            <Link
              href="/light"
              className={`rounded-full px-3 py-1.5 transition ${isActive('/light')}`}
            >
              Зажечь
            </Link>
            <Link
              href="/candles"
              className={`rounded-full px-3 py-1.5 transition ${isActive('/candles')}`}
            >
              Свечи
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`hidden rounded-full px-3 py-1.5 transition md:inline-block ${isActive(
                  '/dashboard'
                )}`}
              >
                Мои свечи
              </Link>
            )}

            {/* Правая часть: логин / пользователь */}
            {loading ? (
              <div className="ml-1 h-7 w-20 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="ml-1 flex items-center gap-2">
                {user.email && (
                  <span className="hidden max-w-[160px] truncate text-[11px] text-slate-500 md:inline">
                    {user.email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-slate-300 px-3.5 py-1.5 text-[11px] font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                title="Войти в аккаунт или зарегистрироваться"
                className="ml-1 rounded-full border border-slate-300 px-3.5 py-1.5 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
              >
                Войти / Регистрация
              </Link>
            )}
          </div>
        </nav>

        {/* Небольшой notification-чип под хедером */}
        {authNotice && (
          <div className="pointer-events-none absolute inset-x-0 top-full flex justify-center">
            <div className="pointer-events-auto mt-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-50 shadow-sm">
              {authNotice}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
