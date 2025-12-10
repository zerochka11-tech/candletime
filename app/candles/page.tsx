'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { CandlesItemList } from '@/components/StructuredDataList';

type Candle = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  is_anonymous: boolean;
  candle_type: string | null;
};

// Типы свечей для статистики
const CANDLE_TYPES = [
  { id: 'calm', label: 'Спокойствие', emoji: '🕊️' },
  { id: 'support', label: 'Поддержка', emoji: '🤝' },
  { id: 'memory', label: 'Память', emoji: '🌙' },
  { id: 'gratitude', label: 'Благодарность', emoji: '✨' },
  { id: 'focus', label: 'Фокус', emoji: '🎯' },
] as const;

type CandleTypeId = (typeof CANDLE_TYPES)[number]['id'];

const CANDLE_TYPE_STYLES: Record<
  string,
  {
    label: string;
    emoji: string;
    cardBg: string;
    chipBg: string;
    chipText: string;
  }
> = {
  calm: {
    label: 'Спокойствие',
    emoji: '🕊️',
    cardBg: 'bg-sky-50',
    chipBg: 'bg-sky-100',
    chipText: 'text-sky-800',
  },
  support: {
    label: 'Поддержка',
    emoji: '🤝',
    cardBg: 'bg-emerald-50',
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-800',
  },
  memory: {
    label: 'Память',
    emoji: '🌙',
    cardBg: 'bg-indigo-50',
    chipBg: 'bg-indigo-100',
    chipText: 'text-indigo-800',
  },
  gratitude: {
    label: 'Благодарность',
    emoji: '✨',
    cardBg: 'bg-amber-50',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-800',
  },
  focus: {
    label: 'Фокус',
    emoji: '🎯',
    cardBg: 'bg-rose-50',
    chipBg: 'bg-rose-100',
    chipText: 'text-rose-800',
  },
};

function getCandleTypeMeta(type: string | null) {
  if (!type || !CANDLE_TYPE_STYLES[type]) {
    return {
      label: 'Свеча',
      emoji: '🕯️',
      cardBg: 'bg-slate-50 dark:bg-slate-800/50',
      chipBg: 'bg-slate-100 dark:bg-slate-700',
      chipText: 'text-slate-700 dark:text-slate-300',
    };
  }
  return CANDLE_TYPE_STYLES[type];
}

function formatRemainingText(expires: Date) {
  const now = Date.now();
  const remainingMs = expires.getTime() - now;

  if (remainingMs <= 0) return 'Скоро погаснет';

  const remainingMinutes = remainingMs / (1000 * 60);
  const remainingHours = remainingMs / (1000 * 60 * 60);

  if (remainingMinutes < 60) {
    const m = Math.max(1, Math.round(remainingMinutes));
    return `Осталось ~${m} мин`;
  }

  if (remainingHours < 24) {
    return `Осталось ~${remainingHours.toFixed(1)} ч`;
  }

  const days = remainingHours / 24;
  return `Осталось ~${days.toFixed(1)} дн`;
}

// Единый формат даты: DD.MM.YY (без времени)
function formatDate(d: Date) {
  return d
    .toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '.');
}

export default function CandlesPage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [popularType, setPopularType] = useState<{
    id: CandleTypeId | null;
    count: number;
  }>({ id: null, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Загрузка статистики
  useEffect(() => {
    const loadStats = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Stats loading timeout')), 10000)
        );

        const statsPromise = (async () => {
          const now = new Date();
          const nowIso = now.toISOString();

          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const startOfTodayIso = startOfToday.toISOString();

          // 1. Кол-во активных свечей
          const { count: active, error: activeError } = await supabase
            .from('candles')
            .select('id', { count: 'exact', head: true })
            .gt('expires_at', nowIso);

          if (activeError) {
            console.error('[Candles] Error loading active count:', activeError);
          } else {
            setActiveCount(active ?? 0);
          }

          // 2. Кол-во свечей, зажжённых сегодня
          const { count: today, error: todayError } = await supabase
            .from('candles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfTodayIso);

          if (todayError) {
            console.error('[Candles] Error loading today count:', todayError);
          } else {
            setTodayCount(today ?? 0);
          }

          // 3. Самая популярная свеча (по типу, за всё время)
          const typeCounts = await Promise.all(
            CANDLE_TYPES.map(async (t) => {
              const { count, error } = await supabase
                .from('candles')
                .select('id', { count: 'exact', head: true })
                .eq('candle_type', t.id);
              if (error) {
                console.error(`[Candles] Error loading type ${t.id}:`, error);
              }
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
        })();

        await Promise.race([statsPromise, timeoutPromise]);
      } catch (e: any) {
        console.error('[Candles] Failed to load stats:', e);
        setActiveCount(0);
        setTodayCount(0);
        setPopularType({ id: null, count: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Загрузка свечей
  useEffect(() => {
    const loadCandles = async () => {
      try {
        // Таймаут для запроса (10 секунд)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Candles loading timeout')), 10000)
        );

        const candlesPromise = (async () => {
          const nowIso = new Date().toISOString();

          const { data, error } = await supabase
            .from('candles')
            .select(
              'id, title, message, created_at, expires_at, is_anonymous, candle_type'
            )
            .gt('expires_at', nowIso)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) {
            console.error('[Candles] Supabase select error:', {
              error,
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            setCandles([]);
          } else if (data) {
            setCandles(data as Candle[]);
          } else {
            console.warn('[Candles] No data received, setting empty array.');
            setCandles([]);
          }
        })();

        await Promise.race([candlesPromise, timeoutPromise]);
      } catch (e: any) {
        console.error('[Candles] Failed to load candles:', e);
        setCandles([]);
      } finally {
        setLoading(false);
      }
    };

    loadCandles();
  }, []);

  const popularMeta =
    popularType.id != null
      ? CANDLE_TYPES.find((t) => t.id === popularType.id)!
      : null;

  if (loading) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Skeleton для заголовка и статистики */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 shadow-md sm:p-4 md:p-5 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          <div className="relative space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 sm:h-6 sm:w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-48 sm:h-4 sm:w-56 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 sm:h-8 w-20 sm:w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          </div>
        </section>
        {/* Skeleton для карточек */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          <div className="relative space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <>
        <CandlesItemList candles={[]} />
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Заголовок и статистика */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 shadow-md sm:p-4 md:p-5 transition-colors duration-200">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
            
            <div className="relative space-y-3 sm:space-y-4">
              {/* Заголовок */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-sm">
                  🕯️
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl md:text-2xl truncate">
                    Свечи
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                    Активные свечи и статистика
                  </p>
                </div>
              </div>

              {/* Статистика: 3 блока - компактные, по всей ширине */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* Активные свечи */}
                <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                  <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                    🔥
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    {statsLoading ? (
                      <div className="h-4 w-12 sm:h-3.5 sm:w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {activeCount ?? 0}
                      </span>
                    )}
                    <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Сейчас горят на странице Свечи
                    </span>
                  </div>
                </div>

                {/* Свечи, зажжённые сегодня */}
                <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                  <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                    ✨
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    {statsLoading ? (
                      <div className="h-4 w-12 sm:h-3.5 sm:w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {todayCount ?? 0}
                      </span>
                    )}
                    <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      За текущие сутки (по времени сервера)
                    </span>
                  </div>
                </div>

                {/* Самая популярная свеча */}
                <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                  <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                    {statsLoading
                      ? '🕯️'
                      : popularMeta
                      ? popularMeta.emoji
                      : '🕯️'}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    {statsLoading ? (
                      <div className="h-4 w-16 sm:h-3.5 sm:w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                    ) : (
                      <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-words line-clamp-1">
                        {popularMeta ? popularMeta.label : '—'}
                      </span>
                    )}
                    {!statsLoading && popularType.count > 0 && (
                      <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Зажигали {popularType.count} раз
                      </span>
                    )}
                    {statsLoading && (
                      <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Считаем статистику
                      </span>
                    )}
                    {!statsLoading && !popularMeta && (
                      <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Ещё нет данных
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Empty state */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-5 sm:p-6 md:p-8 lg:p-10 shadow-md transition-colors duration-200">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
            
            <div className="relative text-center sm:text-left">
              <div className="mb-4 sm:mb-5 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-3xl sm:text-4xl shadow-sm">
                🕯️
              </div>
              <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Пока нет активных свечей
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-5 leading-relaxed">
                Зажги первую свечу на странице{' '}
                <Link 
                  href="/light" 
                  className="inline-flex items-center gap-1 font-medium text-slate-900 dark:text-slate-100 underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  Зажечь
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link> — и она появится здесь.
              </p>
              <Link
                href="/light"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-slate-100 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white dark:text-slate-900 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-200 hover:shadow-lg active:scale-95 touch-manipulation min-h-[44px]"
              >
                <span>🕯️</span>
                <span>Зажечь свечу</span>
              </Link>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <CandlesItemList candles={candles.map(c => ({ id: c.id, title: c.is_anonymous ? 'Анонимная свеча' : c.title }))} />
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Заголовок и статистика */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 shadow-md sm:p-4 md:p-5 transition-colors duration-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative space-y-3 sm:space-y-4">
            {/* Заголовок */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-sm">
                🕯️
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl md:text-2xl truncate">
                  Свечи
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  Активные свечи и статистика
                </p>
              </div>
            </div>

            {/* Статистика: 3 блока - компактные, по всей ширине */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Активные свечи */}
              <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  🔥
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {statsLoading ? (
                    <div className="h-4 w-12 sm:h-3.5 sm:w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {activeCount ?? 0}
                    </span>
                  )}
                  <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Сейчас горят
                  </span>
                </div>
              </div>

              {/* Свечи, зажжённые сегодня */}
              <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  ✨
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {statsLoading ? (
                    <div className="h-4 w-12 sm:h-3.5 sm:w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {todayCount ?? 0}
                    </span>
                  )}
                  <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Сегодня зажгли
                  </span>
                </div>
              </div>

              {/* Самая популярная свеча */}
              <div className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 sm:px-3.5 py-3 sm:py-2 min-h-[52px] sm:min-h-[44px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md active:scale-[0.97] touch-manipulation">
                <div className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 text-base sm:text-sm shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                  {statsLoading
                    ? '🕯️'
                    : popularMeta
                    ? popularMeta.emoji
                    : '🕯️'}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  {statsLoading ? (
                    <div className="h-4 w-16 sm:h-3.5 sm:w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                  ) : (
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-words line-clamp-1">
                      {popularMeta ? popularMeta.label : '—'}
                    </span>
                  )}
                  {!statsLoading && popularType.count > 0 && (
                    <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Зажигали {popularType.count} раз
                    </span>
                  )}
                  {statsLoading && (
                    <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Считаем статистику
                    </span>
                  )}
                  {!statsLoading && !popularMeta && (
                    <span className="text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Ещё нет данных
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Список свечей */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 sm:p-4 md:p-5 shadow-md transition-colors duration-200">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          
          <div className="relative space-y-3 sm:space-y-3">
            {candles.map((candle) => {
              const created = new Date(candle.created_at);
              const expires = new Date(candle.expires_at);

              const remainingText = formatRemainingText(expires);
              const typeMeta = getCandleTypeMeta(candle.candle_type);

              return (
                <Link
                  key={candle.id}
                  href={`/candle/${candle.id}`}
                  className="group block transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] touch-manipulation"
                >
                  <article
                    className={`rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 text-sm text-slate-800 dark:text-slate-200 shadow-md transition-all duration-300 ${typeMeta.cardBg} group-hover:-translate-y-0.5 group-hover:border-slate-400 dark:group-hover:border-slate-600 group-hover:shadow-lg`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div
                        className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium ${typeMeta.chipBg} ${typeMeta.chipText}`}
                      >
                        <span className="text-xs sm:text-sm">{typeMeta.emoji}</span>
                        <span>{typeMeta.label}</span>
                      </div>
                      {/* Только дата, без времени */}
                      <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(created)}
                      </span>
                    </div>

                    <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-slate-50 leading-snug mb-1">
                      {candle.is_anonymous ? 'Анонимная свеча' : candle.title}
                    </h2>

                    {candle.message && (
                      <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {candle.message}
                      </p>
                    )}

                    {/* Только инфо об оставшемся времени, без "горит до ..." */}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {remainingText}
                      </p>
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                        Открыть →
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
