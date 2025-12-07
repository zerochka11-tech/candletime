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
  status: string; // 'active' | 'expired' | 'extinguished' | ...
  candle_type: string | null;
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

// Единый формат даты: DD.MM.YY
function formatDate(d: Date) {
  return d
    .toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '.');
}

type CandleStatus = 'active' | 'expired' | 'extinguished';
type Filter = 'all' | CandleStatus;

function getComputedStatus(candle: Candle): CandleStatus {
  if (candle.status === 'extinguished') return 'extinguished';

  const now = new Date();
  const expires = new Date(candle.expires_at);

  if (expires <= now) return 'expired';

  return 'active';
}

function getStatusLabel(status: CandleStatus) {
  if (status === 'active') return 'Активна';
  if (status === 'extinguished') return 'Погашена вручную';
  return 'Погасла';
}

function getStatusChipClasses(status: CandleStatus) {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 'extinguished') {
    return 'bg-rose-100 text-rose-800';
  }
  return 'bg-slate-200 text-slate-700';
}

// Текст внизу карточки
function getFooterText(candle: Candle, status: CandleStatus) {
  const now = Date.now();
  const expiresMs = new Date(candle.expires_at).getTime();
  const remainingMs = expiresMs - now;

  if (status === 'extinguished') {
    return 'Свеча погашена вручную раньше времени.';
  }

  if (status === 'expired') {
    return 'Свеча погасла автоматически, когда истекло её время.';
  }

  if (remainingMs <= 0) return 'Скоро погаснет.';

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

const PAGE_SIZE = 15;

type TypeMeta = {
  label: string;
  emoji: string;
  cardBg: string;
  chipBg: string;
  chipText: string;
};

function DashboardCandleCard({
  candle,
  typeMeta,
  onExtinguish,
  isUpdating,
}: {
  candle: Candle & { computedStatus: CandleStatus };
  typeMeta: TypeMeta;
  onExtinguish: () => void;
  isUpdating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const created = new Date(candle.created_at);
  const expires = new Date(candle.expires_at);
  const status = candle.computedStatus;
  const footerText = getFooterText(candle, status);
  const canExtinguish = status === 'active';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/candle/${candle.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/candle/${candle.id}`;
    const title = candle.title;
    const text = candle.message || 'Посмотри на эту свечу';

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
      handleCopyLink(e);
    }
  };

  return (
    <article
      className={`group relative rounded-2xl border border-slate-200/70 p-4 text-sm text-slate-800 shadow-sm transition-shadow md:p-5 ${typeMeta.cardBg} hover:shadow-md`}
    >
      {/* Верх: тип, статус, дата */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${typeMeta.chipBg} ${typeMeta.chipText}`}
          >
            <span className="text-sm">{typeMeta.emoji}</span>
            <span>{typeMeta.label}</span>
          </div>

          <span
            className={
              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ' +
              getStatusChipClasses(status)
            }
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <span className="text-[11px] text-slate-500">
          {formatDate(created)}
        </span>
      </div>

      {/* Текст свечи */}
      <div className="space-y-1.5">
        <Link
          href={`/candle/${candle.id}`}
          className="block text-sm font-semibold text-slate-900 transition-colors hover:text-slate-950"
        >
          {candle.title}
        </Link>
        {candle.message && (
          <p className="text-sm text-slate-700 line-clamp-2">{candle.message}</p>
        )}
      </div>

      {/* Низ: оставшееся время + действия */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">
          {footerText}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            title="Поделиться"
          >
            <span>📤</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            title="Копировать ссылку"
          >
            <span>{copied ? '✓' : '🔗'}</span>
          </button>
          {canExtinguish && (
            <button
              type="button"
              onClick={onExtinguish}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true">🔥</span>
              <span>{isUpdating ? 'Гасим…' : 'Погасить'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [noUser, setNoUser] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        setNoUser(true);
        setLoading(false);
        return;
      }

      setUserEmail(authData.user.email ?? null);

      // История только за последние 30 дней
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from('candles')
        .select(
          'id, title, message, created_at, expires_at, status, candle_type'
        )
        .eq('user_id', authData.user.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCandles(data as Candle[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleExtinguish = async (candle: Candle) => {
    const status = getComputedStatus(candle);
    if (status !== 'active') return;

    const ok = window.confirm('Погасить эту свечу раньше времени?');
    if (!ok) return;

    try {
      setUpdatingId(candle.id);
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('candles')
        .update({
          status: 'extinguished',
          expires_at: nowIso,
        })
        .eq('id', candle.id);

      if (error) {
        console.error('Extinguish error:', error);
        alert('Не получилось погасить свечу. Попробуй ещё раз.');
        return;
      }

      setCandles((prev) =>
        prev.map((c) =>
          c.id === candle.id
            ? { ...c, status: 'extinguished', expires_at: nowIso }
            : c
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // При смене фильтра возвращаемся на первую страницу
  useEffect(() => {
    setPage(1);
  }, [filter]);

  if (loading) {
    return (
      <p className="text-sm text-slate-600">Загружаем твои свечи…</p>
    );
  }

  if (noUser) {
    return (
      <section className="rounded-3xl bg-white p-6 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100 md:p-8">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Мои свечи</h1>
        <p className="mb-4">
          Личный кабинет доступен после входа в аккаунт. Здесь будут храниться
          все свечи, которые ты зажигал(а).
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          Войти и открыть Мои свечи
        </Link>
      </section>
    );
  }

  const hasCandles = candles.length > 0;

  // Добавляем вычисленный статус
  const decorated = candles.map((c) => ({
    ...c,
    computedStatus: getComputedStatus(c),
  }));

  const counts = {
    active: decorated.filter((c) => c.computedStatus === 'active').length,
    expired: decorated.filter((c) => c.computedStatus === 'expired').length,
    extinguished: decorated.filter((c) => c.computedStatus === 'extinguished')
      .length,
  };

  const filteredCandles: (Candle & { computedStatus: CandleStatus })[] =
    filter === 'all'
      ? decorated
      : decorated.filter((c) => c.computedStatus === filter);

  const totalItems = filteredCandles.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / PAGE_SIZE);

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pagedCandles = filteredCandles.slice(startIndex, endIndex);

  const activeCandles = counts.active;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Заголовок + CTA */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Мои свечи</h1>
          {userEmail && (
            <p className="text-sm text-slate-600">
              Вошли как <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        <Link
          href="/light"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          Зажечь новую свечу
        </Link>
      </div>

      {/* Контент */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-7">
        {!hasCandles ? (
          <p className="text-sm text-slate-600">
            У тебя пока нет свечей за последние 30 дней. Зажги первую на странице{' '}
            <span className="font-medium">Зажечь</span>.
          </p>
        ) : (
          <>
            {/* Подзаголовок */}
            <div className="mb-4 flex flex-col gap-2 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
              <span>
                История хранится за последние 30 дней. Активные свечи можно
                досрочно погасить — они исчезнут из общего списка, но останутся
                здесь.
              </span>
              {activeCandles > 0 && (
                <span className="text-[11px] text-slate-500">
                  Сейчас горит: {activeCandles}
                </span>
              )}
            </div>

            {/* Фильтры */}
            <div className="mb-4 inline-flex flex-wrap gap-2 rounded-full bg-slate-50 p-1 text-[11px]">
              <FilterChip
                label="Все"
                active={filter === 'all'}
                count={decorated.length}
                onClick={() => setFilter('all')}
              />
              <FilterChip
                label="Активные"
                active={filter === 'active'}
                count={counts.active}
                onClick={() => setFilter('active')}
              />
              <FilterChip
                label="Погасшие"
                active={filter === 'expired'}
                count={counts.expired}
                onClick={() => setFilter('expired')}
              />
              <FilterChip
                label="Погашенные вручную"
                active={filter === 'extinguished'}
                count={counts.extinguished}
                onClick={() => setFilter('extinguished')}
              />
            </div>

            {/* Список свечей + пагинация */}
            {totalItems === 0 ? (
              <p className="text-xs text-slate-500">
                В этом разделе пока нет свечей за последние 30 дней.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {pagedCandles.map((candle) => {
                    const typeMeta = getCandleTypeMeta(candle.candle_type);

                    return (
                      <DashboardCandleCard
                        key={candle.id}
                        candle={candle}
                        typeMeta={typeMeta}
                        isUpdating={updatingId === candle.id}
                        onExtinguish={() => handleExtinguish(candle)}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-5 flex flex-col items-center justify-between gap-2 text-[11px] text-slate-500 md:flex-row">
                    <div>
                      Показано{' '}
                      <span className="font-medium">
                        {totalItems === 0 ? 0 : startIndex + 1}–
                        {Math.min(endIndex, totalItems)}
                      </span>{' '}
                      из <span className="font-medium">{totalItems}</span> свечей
                    </div>

                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ← Назад
                      </button>
                      <span>
                        Страница{' '}
                        <span className="font-medium">{safePage}</span> из{' '}
                        <span className="font-medium">{totalPages}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={safePage === totalPages}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Далее →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1 rounded-full px-3 py-1 transition ' +
        (active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:bg-white hover:text-slate-900')
      }
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-400">({count})</span>
    </button>
  );
}
