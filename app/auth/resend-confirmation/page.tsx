'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ResendConfirmationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!email) {
        setError('Укажи email адрес.');
        return;
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/confirm`;

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (resendError) {
        console.error(resendError);
        setError('Не удалось отправить письмо. Проверь email адрес или попробуй позже.');
        return;
      }

      setMessage(`✅ Письмо с подтверждением отправлено на ${email}. Проверь почту (включая папку "Спам").`);
      setEmail('');
    } catch (err) {
      console.error(err);
      setError('Произошла ошибка. Попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

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
        
        <div className="relative space-y-1.5 sm:space-y-2">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            Повторная отправка письма
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base leading-relaxed">
            Не получил письмо с подтверждением? Введи email, и мы отправим новую ссылку.
          </p>
        </div>

        <form onSubmit={handleResend} className="relative mt-4 sm:mt-5 space-y-3 sm:space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-slate-900 dark:bg-slate-700 px-4 py-3.5 sm:py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-600 min-h-[48px] sm:min-h-0"
          >
            {loading ? 'Отправляем…' : 'Отправить письмо'}
          </button>

          {message && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 whitespace-pre-line">{message}</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="pt-2 sm:pt-3 space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Уже подтвердил email?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-slate-900 dark:text-slate-100 underline-offset-4 hover:underline"
              >
                Войти
              </Link>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Нет аккаунта?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-slate-900 dark:text-slate-100 underline-offset-4 hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

