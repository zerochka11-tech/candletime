'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Типы свечей для статистики
const CANDLE_TYPES = [
  { id: 'calm', label: 'Спокойствие', emoji: '🕊️' },
  { id: 'support', label: 'Поддержка', emoji: '🤝' },
  { id: 'memory', label: 'Память', emoji: '🌙' },
  { id: 'gratitude', label: 'Благодарность', emoji: '✨' },
  { id: 'focus', label: 'Фокус', emoji: '🎯' },
] as const;

type CandleTypeId = (typeof CANDLE_TYPES)[number]['id'];

export default function HomePage() {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [popularType, setPopularType] = useState<{
    id: CandleTypeId | null;
    count: number;
  }>({ id: null, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const now = new Date();
        const nowIso = now.toISOString();

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayIso = startOfToday.toISOString();

        // 1. Кол-во активных свечей
        const { count: active } = await supabase
          .from('candles')
          .select('id', { count: 'exact', head: true })
          .gt('expires_at', nowIso);

        setActiveCount(active ?? 0);

        // 2. Кол-во свечей, зажжённых сегодня
        const { count: today } = await supabase
          .from('candles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfTodayIso);

        setTodayCount(today ?? 0);

        // 3. Самая популярная свеча (по типу, за всё время)
        const typeCounts = await Promise.all(
          CANDLE_TYPES.map(async (t) => {
            const { count } = await supabase
              .from('candles')
              .select('id', { count: 'exact', head: true })
              .eq('candle_type', t.id);
            return { id: t.id, count: count ?? 0 };
          })
        );

        let best = { id: null as CandleTypeId | null, count: 0 };
        for (const item of typeCounts) {
          if (item.count > best.count) {
            best = { id: item.id as CandleTypeId, count: item.count };
          }
        }
        setPopularType(best);
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const popularMeta =
    popularType.id != null
      ? CANDLE_TYPES.find((t) => t.id === popularType.id)!
      : null;

  return (
    // общий вертикальный стек секций
    <div className="flex flex-col gap-6 md:gap-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5" />
        
        <div className="relative flex flex-col items-center gap-10 p-6 md:flex-row md:items-center md:justify-between md:p-8 lg:p-10">
          {/* Текст */}
          <div className="max-w-xl space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-300">
              CandleTime
            </p>

            <h1 className="text-2xl font-bold leading-tight md:text-3xl lg:text-4xl lg:leading-tight">
              Тихое место для
              <br className="hidden sm:block" /> символических свечей
            </h1>

            <p className="text-sm leading-relaxed text-slate-200 md:text-base">
              Зажги свечу, оставь намерение и вернись позже. Без ленты и лайков — только спокойный жест внимания.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/light"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
              >
                <span>🕯️</span>
                <span>Зажечь свечу</span>
              </Link>
              <Link
                href="/candles"
                className="inline-flex items-center gap-2 rounded-full border border-slate-500/70 px-6 py-3 text-sm font-medium text-slate-50 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-900/40"
              >
                <span>👁️</span>
                <span>Посмотреть свечи</span>
              </Link>
            </div>

            <p className="pt-2 text-xs leading-relaxed text-slate-300">
              Войдёшь в аккаунт — появится личный кабинет{' '}
              <span className="font-medium text-slate-100">Мои свечи</span> с
              историей именно твоих свечей.
            </p>
          </div>

          {/* Свечка с анимацией */}
          <div className="flex justify-center md:justify-end">
            <div className="flex flex-col items-center">
              {/* усиленное свечение */}
              <div className="h-20 w-20 rounded-full bg-amber-300/60 blur-2xl animate-pulse" />
              {/* пламя */}
              <div className="-mt-12 candle-flame flex h-12 w-12 items-center justify-center">
                <div className="h-10 w-6 rounded-full bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 shadow-lg" />
              </div>
              {/* тело свечи */}
              <div className="-mt-1 h-28 w-8 rounded-full bg-slate-100 shadow-inner shadow-slate-900/40" />
              {/* тень */}
              <div className="mt-3 h-3 w-28 rounded-full bg-black/40 blur-sm opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS: 3 блока над "What is this?" */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Активные свечи */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-base">
                🔥
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Активные свечи
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {activeCount ?? 0}
                </p>
              )}
              <span className="text-xs text-slate-600">
                Сейчас горят на странице Свечи
              </span>
            </div>
          </div>
        </div>

        {/* Свечи, зажжённые сегодня */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-base">
                ✨
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Сегодня зажгли
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {todayCount ?? 0}
                </p>
              )}
              <span className="text-xs text-slate-600">
                За текущие сутки (по времени сервера)
              </span>
            </div>
          </div>
        </div>

        {/* Самая популярная свеча */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-base">
                {statsLoading
                  ? '🕯️'
                  : popularMeta
                  ? popularMeta.emoji
                  : '🕯️'}
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Самая популярная свеча
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {statsLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  {popularMeta ? popularMeta.label : '—'}
                </p>
              )}
              {!statsLoading && popularType.count > 0 && (
                <span className="text-xs text-slate-600">
                  Зажигали {popularType.count} раз
                </span>
              )}
              {statsLoading && (
                <span className="text-xs text-slate-600">
                  Считаем статистику
                </span>
              )}
              {!statsLoading && !popularMeta && (
                <span className="text-xs text-slate-600">
                  Ещё нет данных
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS THIS */}
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Что это?</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            CandleTime — спокойный микросервис, который открывается за пару
            секунд. Можно пользоваться анонимно или с аккаунтом, если нужна
            история свечей.
          </p>
        </div>

        <ul className="space-y-4 text-sm text-slate-700">
          <li className="group flex gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-base">
              🎯
            </div>
            <div className="flex-1">
              <span className="font-semibold text-slate-900">Личные намерения.</span>{' '}
              Свеча «про себя» — перед важным звонком, стартом проекта или просто чтобы
              зафиксировать внутреннее состояние.
            </div>
          </li>
          <li className="group flex gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-base">
              🤝
            </div>
            <div className="flex-1">
              <span className="font-semibold text-slate-900">Поддержка других.</span>{' '}
              Имя друга, коллеги или близкого — цифровой жест «я про тебя помню» вместо
              длинных сообщений.
            </div>
          </li>
          <li className="group flex gap-4 rounded-xl p-4 transition-colors hover:bg-slate-50">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base">
              📅
            </div>
            <div className="flex-1">
              <span className="font-semibold text-slate-900">Даты и события.</span>{' '}
              Годовщины, дедлайны, памятные дни — свечи мягко отмечают момент без
              соцсетевого шума.
            </div>
          </li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Как это работает
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Без регистрации можно зажечь свечу. С аккаунтом — появляется
              личная история свечей.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="group space-y-3 rounded-xl p-4 transition-all hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  1
                </div>
                <div className="text-2xl">✍️</div>
              </div>
              <p className="text-base font-semibold text-slate-900">
                Задай намерение
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                На странице <span className="font-medium text-slate-900">Зажечь</span> задаёшь
                заголовок, сообщение и, при желании, анонимность.
              </p>
            </div>

            <div className="group space-y-3 rounded-xl p-4 transition-all hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  2
                </div>
                <div className="text-2xl">⏱️</div>
              </div>
              <p className="text-base font-semibold text-slate-900">
                Выбери длительность
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Час, сутки или неделя. Когда время заканчивается, свеча
                автоматически исчезает из списка активных.
              </p>
            </div>

            <div className="group space-y-3 rounded-xl p-4 transition-all hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                  3
                </div>
                <div className="text-2xl">👀</div>
              </div>
              <p className="text-base font-semibold text-slate-900">
                Вернись и посмотри
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Активные свечи — на странице{' '}
                <span className="font-medium text-slate-900">Свечи</span>, свои — в{' '}
                <span className="font-medium text-slate-900">Мои свечи</span> после входа.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 py-10 text-center text-sm text-slate-100 shadow-lg md:px-8 md:py-12">
        {/* Декоративный паттерн */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:24px_24px]" />
        </div>
        
        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-50 md:text-xl">
              Попробуй зажечь одну свечу и вернись к ней позже.
            </p>
            <p className="text-sm text-slate-300">
              Просто, спокойно, без лишнего.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/light"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg"
            >
              <span>🕯️</span>
              <span>Зажечь свечу</span>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-500/70 px-6 py-3 text-sm font-medium text-slate-50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-800/50"
            >
              <span>🔐</span>
              <span>Войти и Мои свечи</span>
            </Link>
          </div>

          <p className="pt-2 text-xs text-slate-400">
            Пет-проект: никаких реальных пожертвований или оплат — только
            символические свечи и текст.
          </p>
        </div>
      </section>
    </div>
  );
}
