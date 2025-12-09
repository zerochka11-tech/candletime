'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { checkAdminAccess } from '@/lib/admin';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showAdminChoice, setShowAdminChoice] = useState(false);

  // Если уже залогинен — уводим в кабинет
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        const { isAdmin } = await checkAdminAccess();
        if (isAdmin) {
          setShowAdminChoice(true);
        } else {
          router.replace('/dashboard');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText(null);

    try {
      if (!email || !password) {
        setErrorText('Укажи, пожалуйста, email и пароль.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(error);
        setErrorText(
          error.message === 'Invalid login credentials'
            ? 'Неверный email или пароль.'
            : 'Не удалось войти. Попробуй ещё раз.'
        );
        return;
      }

      // Проверяем права администратора
      const { isAdmin } = await checkAdminAccess();
      
      if (isAdmin) {
        // Показываем выбор для админа
        setShowAdminChoice(true);
      } else {
        // Обычный редирект
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setErrorText('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  // Если показываем выбор для админа
  if (showAdminChoice) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 sm:gap-4">
        <div className="text-xs text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 min-h-[44px] sm:min-h-0"
          >
            <span aria-hidden="true">←</span>
            На главную
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-900/20 dark:via-slate-800/50 dark:to-slate-800 p-4 sm:p-6 md:p-8 shadow-sm transition-colors duration-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative space-y-4 sm:space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-3xl shadow-md">
                🔐
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl mb-2">
                Добро пожаловать, администратор!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Куда перейти?
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4">
              <Link
                href="/admin/articles"
                className="group relative overflow-hidden rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/30 dark:to-slate-800 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                    📝
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                      Админ-панель
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Управление статьями и контентом
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="group relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                    📋
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                      Мои свечи
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Личный кабинет и история свечей
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-slate-600 dark:text-slate-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 sm:gap-4">
      {/* Маленькая крошка "назад" */}
        <div className="text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 min-h-[44px] sm:min-h-0"
        >
          <span aria-hidden="true">←</span>
          На главную
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 sm:p-6 md:p-8 shadow-sm transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-1.5 sm:space-y-2">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">Вход</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base leading-relaxed">
            Войди в свой аккаунт, чтобы видеть историю свечей и личный кабинет{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">Мои свечи</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-4 sm:mt-5 space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1.5 sm:mb-1 block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 md:text-base">
              Электронная почта
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 sm:py-2.5 text-sm outline-none shadow-sm transition min-h-[44px] sm:min-h-0 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1.5 sm:mb-1 block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 md:text-base">
              Пароль
            </label>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль от аккаунта"
              className="w-full rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 sm:py-2.5 text-sm outline-none shadow-sm transition min-h-[44px] sm:min-h-0 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-1 focus:ring-slate-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-slate-900 dark:bg-slate-700 px-4 py-3.5 sm:py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 min-h-[48px] sm:min-h-0"
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>

          {errorText && (
            <p className="text-xs text-red-600 dark:text-red-400">{errorText}</p>
          )}

          <p className="pt-2 sm:pt-3 text-xs text-slate-600 dark:text-slate-400">
            Нет аккаунта?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-slate-900 dark:text-slate-100 underline-offset-4 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
