/**
 * Общие утилиты для проекта CandleTime
 */

import type { CandleTypeId, CandleTypeStyle, CandleStatus, Candle } from './types';
import { CANDLE_TYPE_STYLES, DEFAULT_CANDLE_TYPE_STYLE } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Утилита для объединения классов Tailwind
 * 
 * @param inputs - Классы CSS или объекты с условиями
 * @returns Объединенная строка классов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Получает метаданные типа свечи (стили, эмодзи, цвета)
 * 
 * @param type - Идентификатор типа свечи ('calm', 'support', 'memory', 'gratitude', 'focus') или null
 * @returns Объект со стилями типа свечи или стили по умолчанию, если тип не найден
 * 
 * @example
 * ```typescript
 * const meta = getCandleTypeMeta('calm');
 * // Возвращает: { label: 'Спокойствие', emoji: '🕊️', cardBg: 'bg-sky-50...', ... }
 * ```
 */
export function getCandleTypeMeta(type: CandleTypeId | string | null): CandleTypeStyle {
  if (!type || !CANDLE_TYPE_STYLES[type as CandleTypeId]) {
    return DEFAULT_CANDLE_TYPE_STYLE;
  }
  return CANDLE_TYPE_STYLES[type as CandleTypeId];
}

/**
 * Вычисляет текущий статус свечи на основе даты истечения и текущего статуса
 * 
 * @param candle - Объект свечи с полями status и expires_at
 * @returns Статус свечи: 'active' (активна), 'expired' (погасла), 'extinguished' (погашена вручную)
 * 
 * @example
 * ```typescript
 * const status = getComputedStatus(candle);
 * // Возвращает 'active', 'expired' или 'extinguished'
 * ```
 */
export function getComputedStatus(candle: Candle): CandleStatus {
  if (candle.status === 'extinguished') return 'extinguished';

  const now = new Date();
  const expires = new Date(candle.expires_at);

  if (expires <= now) return 'expired';

  return 'active';
}

/**
 * Получает локализованную текстовую метку для статуса свечи
 * 
 * @param status - Статус свечи ('active', 'expired', 'extinguished')
 * @returns Текстовая метка статуса на русском языке
 * 
 * @example
 * ```typescript
 * const label = getStatusLabel('active');
 * // Возвращает: 'Активна'
 * ```
 */
export function getStatusLabel(status: CandleStatus): string {
  if (status === 'active') return 'Активна';
  if (status === 'extinguished') return 'Погашена вручную';
  return 'Погасла';
}

/**
 * Форматирует дату в формат DD.MM.YYYY
 * 
 * @param date - Дата в формате Date или ISO строки
 * @returns Отформатированная дата в формате DD.MM.YYYY
 * 
 * @example
 * ```typescript
 * const formatted = formatDate(new Date('2025-01-15'));
 * // Возвращает: '15.01.2025'
 * ```
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d
    .toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .replace(/\//g, '.');
}

/**
 * Форматирует оставшееся время до истечения свечи в читаемый формат
 * 
 * @param expires - Дата истечения в формате Date или ISO строки
 * @returns Строка с оставшимся временем: 'Осталось ~X мин', 'Осталось ~X ч' или 'Осталось ~X дн'
 *          Если время истекло, возвращает 'Скоро погаснет'
 * 
 * @example
 * ```typescript
 * const remaining = formatRemainingTime(new Date(Date.now() + 3600000));
 * // Возвращает: 'Осталось ~1.0 ч'
 * ```
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


