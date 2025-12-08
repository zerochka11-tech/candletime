'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { DynamicMeta } from '@/components/DynamicMeta';

type Candle = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  is_anonymous: boolean;
  candle_type: string | null;
  status: string;
};

const CANDLE_TYPE_STYLES: Record<
  string,
  { label: string; emoji: string; cardBg: string; chipBg: string; chipText: string }
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

function formatDate(d: Date) {
  return d
    .toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '.');
}

function formatDateTime(d: Date) {
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRemainingText(expires: Date) {
  const now = Date.now();
  const remainingMs = expires.getTime() - now;

  if (remainingMs <= 0) return 'Свеча погасла';

  const remainingMinutes = remainingMs / (1000 * 60);
  const remainingHours = remainingMs / (1000 * 60 * 60);

  if (remainingMinutes < 60) {
    const m = Math.max(1, Math.round(remainingMinutes));
    return `${m} мин`;
  }

  if (remainingHours < 24) {
    return `${Math.round(remainingHours)} ч`;
  }

  const days = remainingHours / 24;
  return `${Math.round(days)} дн`;
}

function getStatus(candle: Candle): 'active' | 'expired' | 'extinguished' {
  if (candle.status === 'extinguished') return 'extinguished';

  const now = new Date();
  const expires = new Date(candle.expires_at);

  if (expires <= now) return 'expired';

  return 'active';
}

export default function CandlePage() {
  const params = useParams();
  const router = useRouter();
  const candleId = params.id as string;

  const [candle, setCandle] = useState<Candle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    const loadCandle = async () => {
      try {
        const { data, error } = await supabase
          .from('candles')
          .select('id, title, message, created_at, expires_at, is_anonymous, candle_type, status')
          .eq('id', candleId)
          .single();

        if (error) {
          console.error('Error loading candle:', error);
          setError('Свеча не найдена');
          return;
        }

        if (!data) {
          setError('Свеча не найдена');
          return;
        }

        setCandle(data as Candle);
      } catch (e) {
        console.error('Failed to load candle:', e);
        setError('Не удалось загрузить свечу');
      } finally {
        setLoading(false);
      }
    };

    if (candleId) {
      loadCandle();
    }
  }, [candleId]);

  // Live-обновление времени для активных свечей
  useEffect(() => {
    if (!candle) return;

    const expires = new Date(candle.expires_at);
    const updateTime = () => {
      const now = Date.now();
      const remainingMs = expires.getTime() - now;
      
      if (remainingMs <= 0) {
        setRemainingTime('Свеча погасла');
        return;
      }

      setRemainingTime(formatRemainingText(expires));
    };

    // Обновляем сразу
    updateTime();

    // Обновляем каждую минуту
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [candle]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = candle?.is_anonymous ? 'Анонимная свеча' : candle?.title || 'Свеча';
    const text = candle?.message || 'Посмотри на эту свечу';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (e) {
        // Пользователь отменил шаринг
      }
    } else {
      // Fallback на копирование
      handleCopyLink();
    }
  };

  // Skeleton loading
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-4 w-20 sm:w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm md:p-8 transition-colors duration-200">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-6 w-16 sm:h-7 sm:w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-6 w-12 sm:h-7 sm:w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-3 w-12 sm:h-4 sm:w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-7 w-3/4 sm:h-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4">
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="h-10 w-28 sm:w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 w-36 sm:w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-10 w-40 sm:w-44 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !candle) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-4 sm:p-6 text-center shadow-sm md:p-8 transition-colors duration-200">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative">
          <h1 className="mb-2 text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 md:text-2xl">
            Свеча не найдена
          </h1>
          <p className="mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 md:text-base">
            {error || 'Эта свеча не существует или была удалена.'}
          </p>
          <Link
            href="/candles"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-slate-700 px-6 py-3 sm:py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-md min-h-[44px] sm:min-h-0"
          >
            Посмотреть все свечи
          </Link>
        </div>
      </div>
    );
  }

  const created = new Date(candle.created_at);
  const expires = new Date(candle.expires_at);
  const status = getStatus(candle);
  const typeMeta = getCandleTypeMeta(candle.candle_type);
  const isActive = status === 'active';
  
  // Используем live-обновляемое время или вычисляем сразу
  const remainingText = remainingTime || formatRemainingText(expires);

  return (
    <div className="space-y-6">
      <DynamicMeta candle={candle} />
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <Link
          href="/candles"
          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-slate-100 min-h-[44px] sm:min-h-0"
        >
          <span>←</span>
          <span>Назад к свечам</span>
        </Link>
      </div>

      {/* Карточка свечи */}
      <section
        className={`relative overflow-hidden rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-md sm:p-6 md:p-8 transition-colors duration-200 ${typeMeta.cardBg}`}
      >
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-4 sm:space-y-5 md:space-y-6">
          {/* Верх: тип, статус, дата */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div
                className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium ${typeMeta.chipBg} ${typeMeta.chipText}`}
              >
                <span className="text-sm sm:text-base">{typeMeta.emoji}</span>
                <span>{typeMeta.label}</span>
              </div>

              {isActive && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-800/50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  Активна
                </span>
              )}
              {status === 'expired' && (
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
                  Погасла
                </span>
              )}
              {status === 'extinguished' && (
                <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-800/50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-rose-800 dark:text-rose-200">
                  Погашена вручную
                </span>
              )}
            </div>

            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              {formatDate(created)}
            </span>
          </div>

          {/* Заголовок */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl leading-tight">
              {candle.is_anonymous ? 'Анонимная свеча' : candle.title}
            </h1>
          </div>

          {/* Сообщение */}
          {candle.message && (
            <div className="rounded-xl bg-white/60 dark:bg-slate-700/30 p-3 sm:p-4">
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 md:text-lg">
                {candle.message}
              </p>
            </div>
          )}

          {/* Информация о времени (компактная версия) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 rounded-xl bg-white/60 dark:bg-slate-700/30 px-3 py-2.5 text-[10px] sm:px-4 sm:py-3 sm:text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Зажжена:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(created)}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                {isActive ? 'Погаснет:' : 'Погасла:'}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(expires)}
              </span>
            </div>
            {isActive && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Осталось:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {remainingText}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-2 pt-2 sm:gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-2.5 sm:py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md sm:gap-2 sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
            >
              <span>📤</span>
              <span>Поделиться</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-2.5 sm:py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md sm:gap-2 sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
            >
              <span>{copied ? '✓' : '🔗'}</span>
              <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать ссылку'}</span>
              <span className="sm:hidden">{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>
            <Link
              href="/light"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-3 py-2.5 sm:py-2 text-xs font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md sm:gap-2 sm:px-4 sm:text-sm min-h-[44px] sm:min-h-0"
            >
              <span>🕯️</span>
              <span className="hidden sm:inline">Зажечь свою свечу</span>
              <span className="sm:hidden">Зажечь</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

