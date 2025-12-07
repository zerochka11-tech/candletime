'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

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
      cardBg: 'bg-slate-50',
      chipBg: 'bg-slate-100',
      chipText: 'text-slate-700',
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
        console.error('Supabase select error:', error);
      } else if (data) {
        setCandles(data as Candle[]);
      }

      setLoading(false);
    };

    loadCandles();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-slate-600">
        Загружаем активные свечи…
      </p>
    );
  }

  if (candles.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100 md:p-8">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">
          Пока нет активных свечей
        </h1>
        <p>
          Зажги первую свечу на странице{' '}
          <span className="font-medium">Зажечь</span> — и она появится здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Активные свечи
        </h1>
        <p className="text-sm text-slate-600">
          Свечи, которые всё ещё горят. Сейчас их: {candles.length}
        </p>
      </header>

      <section className="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-7">
        <div className="space-y-4">
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
                  className={`rounded-2xl p-4 text-sm text-slate-800 transition-shadow ${typeMeta.cardBg} group-hover:shadow-md`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] ${typeMeta.chipBg} ${typeMeta.chipText}`}
                    >
                      <span>{typeMeta.emoji}</span>
                      <span>{typeMeta.label}</span>
                    </div>
                    {/* Только дата, без времени */}
                    <span className="text-[11px] text-slate-500">
                      {formatDate(created)}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                    {candle.is_anonymous ? 'Анонимная свеча' : candle.title}
                  </h2>

                  {candle.message && (
                    <p className="mt-1 text-sm text-slate-700 line-clamp-2">
                      {candle.message}
                    </p>
                  )}

                  {/* Только инфо об оставшемся времени, без "горит до ..." */}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {remainingText}
                    </p>
                    <span className="text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
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
  );
}
