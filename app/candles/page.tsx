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

  if (loading) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Загружаем активные свечи…
      </p>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative">
          <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            Пока нет активных свечей
          </h1>
          <p className="text-sm md:text-base">
            Зажги первую свечу на странице{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">Зажечь</span> — и она появится здесь.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CandlesItemList candles={candles.map(c => ({ id: c.id, title: c.is_anonymous ? 'Анонимная свеча' : c.title }))} />
      <div className="flex flex-col gap-6 md:gap-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
            Активные свечи
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 md:text-base">
            Свечи, которые всё ещё горят. Сейчас их: <span className="font-medium text-slate-900 dark:text-slate-100">{candles.length}</span>
          </p>
        </header>

      <section className="relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 md:space-y-4">
          {candles.map((candle) => {
            const created = new Date(candle.created_at);
            const expires = new Date(candle.expires_at);

            const remainingText = formatRemainingText(expires);
            const typeMeta = getCandleTypeMeta(candle.candle_type);

            return (
              <Link
                key={candle.id}
                href={`/candle/${candle.id}`}
                className="group block transition-transform hover:-translate-y-0.5"
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

                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-slate-50 leading-snug">
                    {candle.is_anonymous ? 'Анонимная свеча' : candle.title}
                  </h2>

                  {candle.message && (
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
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
