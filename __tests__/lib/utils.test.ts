/**
 * Unit тесты для lib/utils.ts
 */

import {
  formatDate,
  formatRemainingTime,
  getCandleTypeMeta,
  getComputedStatus,
  getStatusLabel,
  cn,
} from '@/lib/utils';
import { DEFAULT_CANDLE_TYPE_STYLE, CANDLE_TYPE_STYLES } from '@/lib/constants';
import type { Candle } from '@/lib/types';

describe('lib/utils', () => {
  describe('formatDate', () => {
    it('форматирует дату в формат DD.MM.YY', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('15.01.25');
    });

    it('работает с ISO строками', () => {
      const isoString = '2025-01-15T10:30:00Z';
      const result = formatDate(isoString);
      expect(result).toBe('15.01.25');
    });

    it('обрабатывает разные даты', () => {
      expect(formatDate(new Date('2024-12-31'))).toBe('31.12.24');
      expect(formatDate(new Date('2026-06-01'))).toBe('01.06.26');
      expect(formatDate(new Date('2025-03-05'))).toBe('05.03.25');
    });

    it('заменяет слэши на точки', () => {
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      // Проверяем, что нет слэшей
      expect(result).not.toContain('/');
      expect(result).toContain('.');
    });

    it('работает с разными локалями', () => {
      // Даже если локаль использует слэши, функция должна заменить их на точки
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{2}$/);
    });
  });

  describe('formatRemainingTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('форматирует минуты правильно', () => {
      const future = new Date('2025-01-15T12:30:00Z'); // +30 минут
      const result = formatRemainingTime(future);
      
      expect(result).toMatch(/Осталось ~\d+ мин/);
      expect(result).toBe('Осталось ~30 мин');
    });

    it('форматирует часы правильно', () => {
      const future = new Date('2025-01-15T14:00:00Z'); // +2 часа
      const result = formatRemainingTime(future);
      
      expect(result).toMatch(/Осталось ~\d+\.\d+ ч/);
      expect(result).toBe('Осталось ~2.0 ч');
    });

    it('форматирует дни правильно', () => {
      const future = new Date('2025-01-18T12:00:00Z'); // +3 дня
      const result = formatRemainingTime(future);
      
      expect(result).toMatch(/Осталось ~\d+\.\d+ дн/);
      expect(result).toBe('Осталось ~3.0 дн');
    });

    it('возвращает "Скоро погаснет" для истекших свечей', () => {
      const past = new Date('2025-01-15T11:00:00Z'); // -1 час
      const result = formatRemainingTime(past);
      
      expect(result).toBe('Скоро погаснет');
    });

    it('обрабатывает границу между минутами и часами', () => {
      const exactly60min = new Date('2025-01-15T13:00:00Z'); // +1 час
      const result = formatRemainingTime(exactly60min);
      
      // Должно быть "ч", а не "мин"
      expect(result).toContain('ч');
      expect(result).not.toContain('мин');
    });

    it('работает с ISO строками', () => {
      const future = '2025-01-15T14:00:00Z';
      const result = formatRemainingTime(future);
      
      expect(result).toContain('ч');
    });

    it('округляет минуты минимум до 1', () => {
      const future = new Date('2025-01-15T12:00:30Z'); // +30 секунд
      const result = formatRemainingTime(future);
      
      expect(result).toBe('Осталось ~1 мин');
    });

    it('обрабатывает границу 59 минут', () => {
      const future = new Date('2025-01-15T12:59:00Z'); // +59 минут
      const result = formatRemainingTime(future);
      
      expect(result).toContain('мин');
      expect(result).not.toContain('ч');
    });

    it('обрабатывает границу 23 часа', () => {
      const future = new Date('2025-01-16T11:00:00Z'); // +23 часа
      const result = formatRemainingTime(future);
      
      expect(result).toContain('ч');
      expect(result).not.toContain('дн');
    });

    it('обрабатывает границу 24 часа', () => {
      const future = new Date('2025-01-16T12:00:00Z'); // +24 часа (1 день)
      const result = formatRemainingTime(future);
      
      expect(result).toContain('дн');
      expect(result).not.toContain('ч');
    });

    it('обрабатывает точно истекшие свечи (0ms)', () => {
      const exactlyNow = new Date('2025-01-15T12:00:00Z');
      const result = formatRemainingTime(exactlyNow);
      
      expect(result).toBe('Скоро погаснет');
    });
  });

  describe('getCandleTypeMeta', () => {
    it('возвращает стили для известного типа "calm"', () => {
      const result = getCandleTypeMeta('calm');
      
      expect(result.label).toBe('Спокойствие');
      expect(result.emoji).toBe('🕊️');
      expect(result.cardBg).toContain('sky');
      expect(result).toEqual(CANDLE_TYPE_STYLES.calm);
    });

    it('возвращает стили для всех типов свечей', () => {
      const types = ['calm', 'support', 'memory', 'gratitude', 'focus'] as const;
      
      types.forEach(type => {
        const result = getCandleTypeMeta(type);
        expect(result.label).toBeTruthy();
        expect(result.emoji).toBeTruthy();
        expect(result.cardBg).toBeTruthy();
        expect(result.chipBg).toBeTruthy();
        expect(result.chipText).toBeTruthy();
        expect(result).toEqual(CANDLE_TYPE_STYLES[type]);
      });
    });

    it('возвращает дефолтные стили для null', () => {
      const result = getCandleTypeMeta(null);
      expect(result).toEqual(DEFAULT_CANDLE_TYPE_STYLE);
    });

    it('возвращает дефолтные стили для undefined', () => {
      const result = getCandleTypeMeta(undefined as any);
      expect(result).toEqual(DEFAULT_CANDLE_TYPE_STYLE);
    });

    it('возвращает дефолтные стили для неизвестного типа', () => {
      const result = getCandleTypeMeta('unknown-type');
      expect(result).toEqual(DEFAULT_CANDLE_TYPE_STYLE);
    });

    it('возвращает дефолтные стили для пустой строки', () => {
      const result = getCandleTypeMeta('');
      expect(result).toEqual(DEFAULT_CANDLE_TYPE_STYLE);
    });

    it('возвращает правильные стили для каждого типа', () => {
      expect(getCandleTypeMeta('support').label).toBe('Поддержка');
      expect(getCandleTypeMeta('memory').label).toBe('Память');
      expect(getCandleTypeMeta('gratitude').label).toBe('Благодарность');
      expect(getCandleTypeMeta('focus').label).toBe('Фокус');
    });
  });

  describe('getComputedStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('возвращает "extinguished" для погашенных вручную свечей', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-16T12:00:00Z',
        status: 'extinguished',
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('extinguished');
    });

    it('возвращает "active" для активных свечей', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-15T14:00:00Z', // +2 часа
        status: 'active',
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('active');
    });

    it('возвращает "expired" для истекших свечей', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-15T11:00:00Z', // -1 час
        status: 'active',
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('expired');
    });

    it('приоритетно возвращает "extinguished" даже если время истекло', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-15T11:00:00Z', // -1 час
        status: 'extinguished', // Но погашена вручную
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('extinguished'); // Не "expired"!
    });

    it('обрабатывает свечи, которые истекают точно сейчас', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-15T12:00:00Z', // Точно сейчас
        status: 'active',
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('expired');
    });

    it('работает с ISO строками в expires_at', () => {
      const candle: Candle = {
        id: '1',
        title: 'Test',
        message: null,
        created_at: '2025-01-15T10:00:00Z',
        expires_at: '2025-01-15T14:00:00Z',
        status: 'active',
        candle_type: 'calm',
      };
      
      const result = getComputedStatus(candle);
      expect(result).toBe('active');
    });
  });

  describe('getStatusLabel', () => {
    it('возвращает правильные метки для всех статусов', () => {
      expect(getStatusLabel('active')).toBe('Активна');
      expect(getStatusLabel('expired')).toBe('Погасла');
      expect(getStatusLabel('extinguished')).toBe('Погашена вручную');
    });

    it('возвращает локализованные строки', () => {
      const activeLabel = getStatusLabel('active');
      expect(activeLabel).toBeTruthy();
      expect(typeof activeLabel).toBe('string');
      expect(activeLabel.length).toBeGreaterThan(0);
    });
  });

  describe('cn', () => {
    it('объединяет классы Tailwind', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });

    it('обрабатывает условные классы', () => {
      const result = cn('bg-red-500', false && 'text-white', 'p-4');
      expect(result).toBe('bg-red-500 p-4');
    });

    it('обрабатывает null и undefined', () => {
      const result = cn('bg-red-500', null, undefined, 'p-4');
      expect(result).toBe('bg-red-500 p-4');
    });

    it('обрабатывает объекты с условиями', () => {
      const result = cn({
        'bg-red-500': true,
        'text-white': false,
        'p-4': true,
      });
      expect(result).toBe('bg-red-500 p-4');
    });

    it('объединяет конфликтующие классы Tailwind правильно', () => {
      // tailwind-merge должен разрешать конфликты
      const result = cn('p-4', 'p-8');
      // Должен остаться только последний (p-8)
      expect(result).toBe('p-8');
    });

    it('обрабатывает массивы классов', () => {
      const result = cn(['bg-red-500', 'text-white'], 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    it('обрабатывает смешанные типы', () => {
      const result = cn(
        'bg-red-500',
        ['text-white', 'font-bold'],
        { 'p-4': true, 'm-2': false },
        null,
        undefined
      );
      expect(result).toBe('bg-red-500 text-white font-bold p-4');
    });
  });
});

