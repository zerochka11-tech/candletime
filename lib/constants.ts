/**
 * Централизованные константы для проекта CandleTime
 */

import type { CandleType, CandleTypeId, CandleTypeStyle } from './types';

export const CANDLE_TYPES: readonly CandleType[] = [
  {
    id: 'calm',
    label: 'Спокойствие',
    emoji: '🕊️',
  },
  {
    id: 'support',
    label: 'Поддержка',
    emoji: '🤝',
  },
  {
    id: 'memory',
    label: 'Память',
    emoji: '🌙',
  },
  {
    id: 'gratitude',
    label: 'Благодарность',
    emoji: '✨',
  },
  {
    id: 'focus',
    label: 'Фокус',
    emoji: '🎯',
  },
] as const;

export const DURATION_OPTIONS = [
  { value: '1', label: '1 час' },
  { value: '24', label: '24 часа' },
  { value: '168', label: '7 дней' },
] as const;

export const CANDLE_TYPE_STYLES: Record<CandleTypeId, CandleTypeStyle> = {
  calm: {
    label: 'Спокойствие',
    emoji: '🕊️',
    cardBg: 'bg-sky-50 dark:bg-sky-900/20',
    chipBg: 'bg-sky-100 dark:bg-sky-800/50',
    chipText: 'text-sky-800 dark:text-sky-200',
  },
  support: {
    label: 'Поддержка',
    emoji: '🤝',
    cardBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    chipBg: 'bg-emerald-100 dark:bg-emerald-800/50',
    chipText: 'text-emerald-800 dark:text-emerald-200',
  },
  memory: {
    label: 'Память',
    emoji: '🌙',
    cardBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    chipBg: 'bg-indigo-100 dark:bg-indigo-800/50',
    chipText: 'text-indigo-800 dark:text-indigo-200',
  },
  gratitude: {
    label: 'Благодарность',
    emoji: '✨',
    cardBg: 'bg-amber-50 dark:bg-amber-900/20',
    chipBg: 'bg-amber-100 dark:bg-amber-800/50',
    chipText: 'text-amber-800 dark:text-amber-200',
  },
  focus: {
    label: 'Фокус',
    emoji: '🎯',
    cardBg: 'bg-rose-50 dark:bg-rose-900/20',
    chipBg: 'bg-rose-100 dark:bg-rose-800/50',
    chipText: 'text-rose-800 dark:text-rose-200',
  },
};

export const DEFAULT_CANDLE_TYPE_STYLE: CandleTypeStyle = {
  label: 'Свеча',
  emoji: '🕯️',
  cardBg: 'bg-slate-50 dark:bg-slate-800/50',
  chipBg: 'bg-slate-100 dark:bg-slate-700',
  chipText: 'text-slate-700 dark:text-slate-300',
};


