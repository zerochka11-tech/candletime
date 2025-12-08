/**
 * Общие утилиты для проекта CandleTime
 */

import type { CandleTypeId, CandleTypeStyle, CandleStatus, Candle } from './types';
import { CANDLE_TYPE_STYLES, DEFAULT_CANDLE_TYPE_STYLE } from './constants';

/**
 * Получить метаданные типа свечи
 */
export function getCandleTypeMeta(type: CandleTypeId | string | null): CandleTypeStyle {
  if (!type || !CANDLE_TYPE_STYLES[type as CandleTypeId]) {
    return DEFAULT_CANDLE_TYPE_STYLE;
  }
  return CANDLE_TYPE_STYLES[type as CandleTypeId];
}

/**
 * Вычислить статус свечи на основе даты истечения
 */
export function getComputedStatus(candle: Candle): CandleStatus {
  if (candle.status === 'extinguished') return 'extinguished';

  const now = new Date();
  const expires = new Date(candle.expires_at);

  if (expires <= now) return 'expired';

  return 'active';
}

/**
 * Получить текстовую метку статуса
 */
export function getStatusLabel(status: CandleStatus): string {
  if (status === 'active') return 'Активна';
  if (status === 'extinguished') return 'Погашена вручную';
  return 'Погасла';
}

/**
 * Форматировать дату в формат DD.MM.YY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d
    .toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    .replace(/\//g, '.');
}

/**
 * Форматировать оставшееся время до истечения свечи
 */
export function formatRemainingTime(expires: Date | string): string {
  const expiresDate = typeof expires === 'string' ? new Date(expires) : expires;
  const now = Date.now();
  const remainingMs = expiresDate.getTime() - now;

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

