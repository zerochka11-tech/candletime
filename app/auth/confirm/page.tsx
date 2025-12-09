'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleConfirmation = async () => {
      // Supabase может передавать токен через query параметры или hash
      // Сначала проверяем hash (Supabase часто использует hash-based routing)
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        
        // Если есть access_token в hash, Supabase уже обработал токен
        // Нужно установить сессию вручную
        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionData?.session && !sessionError) {
            setStatus('success');
            setMessage('Email успешно подтвержден! Перенаправляем в личный кабинет...');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
            return;
          }
        }
      }

      // Если нет hash, проверяем query параметры
      const token = searchParams.get('token') || searchParams.get('token_hash');
      const type = searchParams.get('type') || 'signup';
      
      // Также проверяем hash для токенов
      let hashToken = null;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        hashToken = hashParams.get('token');
      }

      // Используем токен из query или hash
      const confirmationToken = token || hashToken;

      if (!confirmationToken) {
        // Проверяем, может быть пользователь уже подтвержден через hash
        if (hash.includes('access_token') || hash.includes('type=recovery')) {
          // Supabase уже обработал токен через hash, просто проверяем сессию
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            setMessage('Email успешно подтвержден! Перенаправляем в личный кабинет...');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
            return;
          }
        }
        
        setStatus('error');
        setMessage('Токен подтверждения не найден. Проверь ссылку из письма.');
        return;
      }

      try {
        // Подтверждение email через Supabase
        // Supabase может использовать разные форматы токенов
        let data, error;

        // Пробуем использовать token_hash (для длинных токенов из URL)
        if (confirmationToken.length > 50) {
          const result = await supabase.auth.verifyOtp({
            token_hash: confirmationToken,
            type: (type || 'signup') as 'signup' | 'email',
          });
          data = result.data;
          error = result.error;
        } else {
          // Для коротких токенов нужен email, но мы его не знаем
          // В этом случае лучше использовать альтернативный метод
          // Или просто проверить сессию, если Supabase уже обработал токен
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionData?.session) {
            data = { user: sessionData.session.user, session: sessionData.session };
            error = null;
          } else {
            error = sessionError || new Error('Не удалось подтвердить токен');
          }
        }

        if (error) {
          console.error('Confirmation error:', error);
          
          // Проверяем тип ошибки
          if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('already')) {
            setStatus('expired');
            setMessage('Ссылка подтверждения истекла, недействительна или уже использована. Запроси новую ссылку.');
          } else {
            setStatus('error');
            setMessage(`Не удалось подтвердить email: ${error.message}`);
          }
          return;
        }

        // Успешное подтверждение
        if (data?.user || data?.session) {
          setStatus('success');
          setMessage('Email успешно подтвержден! Перенаправляем в личный кабинет...');
          
          // Редирект в dashboard через 2 секунды
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Не удалось подтвердить email. Попробуй еще раз.');
        }
      } catch (err) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setMessage('Произошла ошибка при подтверждении email.');
      }
    };

    handleConfirmation();
  }, [searchParams, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 sm:gap-4">
      {/* Крошка "назад" */}
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
        
        <div className="relative space-y-4 sm:space-y-6 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                Подтверждение email
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
                Проверяем ссылку подтверждения...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                Email подтвержден!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
                {message}
              </p>
              <div className="pt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md"
                >
                  Перейти в личный кабинет
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                Ошибка подтверждения
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
                {message}
              </p>
              <div className="pt-4 space-y-2">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md"
                >
                  Зарегистрироваться заново
                </Link>
                <Link
                  href="/auth/login"
                  className="block text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline"
                >
                  Уже есть аккаунт? Войти
                </Link>
              </div>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                Ссылка истекла
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
                {message}
              </p>
              <div className="pt-4 space-y-2">
                <button
                  onClick={async () => {
                    // Запрос новой ссылки подтверждения
                    const email = searchParams.get('email');
                    if (email) {
                      setStatus('loading');
                      setMessage('Отправляем новую ссылку...');
                      
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                        options: {
                          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/confirm`,
                        },
                      });
                      
                      if (!error) {
                        setStatus('success');
                        setMessage(`✅ Новая ссылка подтверждения отправлена на ${email}. Проверь почту.`);
                      } else {
                        setStatus('error');
                        setMessage(`Ошибка: ${error.message}`);
                      }
                    } else {
                      setMessage('Email не указан. Зарегистрируйся заново.');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md"
                >
                  Отправить новую ссылку
                </button>
                <Link
                  href="/auth/login"
                  className="block text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline-offset-4 hover:underline text-center"
                >
                  Уже подтвердил? Войти
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
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
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 sm:p-6 md:p-8 shadow-sm transition-colors duration-200">
            <div className="relative space-y-4 sm:space-y-6 text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
                Загрузка...
              </h1>
            </div>
          </section>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}

