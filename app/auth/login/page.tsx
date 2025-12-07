'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Если уже залогинен — уводим в кабинет
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        router.replace('/dashboard');
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

      // Успешный логин — ведём в личный кабинет
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorText('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      {/* Маленькая крошка "назад" */}
        <div className="text-xs text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          На главную
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/50 to-white p-6 shadow-sm md:p-8">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5" />
        
        <div className="relative space-y-2">
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Вход</h1>
          <p className="text-sm text-slate-600 md:text-base">
            Войди в свой аккаунт, чтобы видеть историю свечей и личный кабинет{' '}
            <span className="font-medium">Мои свечи</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 md:text-base">
              Электронная почта
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm outline-none shadow-sm transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 md:text-base">
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
              className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm outline-none shadow-sm transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>

          {errorText && (
            <p className="text-xs text-red-600">{errorText}</p>
          )}

          <p className="pt-3 text-xs text-slate-600">
            Нет аккаунта?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
