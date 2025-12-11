/**
 * Unit тесты для lib/yandexMetrika.ts
 */

import {
  reachGoal,
  hit,
  params,
  YandexMetrikaGoals,
} from '@/lib/yandexMetrika';

// Мокаем window.ym
const mockYm = jest.fn();
const originalWindow = global.window;

beforeEach(() => {
  global.window = {
    ...originalWindow,
    ym: mockYm,
  } as any;
  mockYm.mockClear();
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID = '105780499';
});

afterEach(() => {
  global.window = originalWindow;
});

describe('lib/yandexMetrika', () => {
  describe('reachGoal', () => {
    it('отправляет цель в Яндекс.Метрику', () => {
      reachGoal('light_candle', { candle_type: 'calm' });

      expect(mockYm).toHaveBeenCalledWith(
        105780499,
        'reachGoal',
        'light_candle',
        { candle_type: 'calm' }
      );
    });

    it('работает без параметров', () => {
      reachGoal('light_candle');

      expect(mockYm).toHaveBeenCalledWith(
        105780499,
        'reachGoal',
        'light_candle',
        undefined
      );
    });

    it('не вызывает ym, если window.ym не определен', () => {
      delete (global.window as any).ym;

      reachGoal('light_candle');

      expect(mockYm).not.toHaveBeenCalled();
    });

    it('не вызывает ym, если NEXT_PUBLIC_YANDEX_METRIKA_ID не установлен', () => {
      delete process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

      reachGoal('light_candle');

      expect(mockYm).not.toHaveBeenCalled();
    });

    it('обрабатывает ошибки gracefully', () => {
      mockYm.mockImplementation(() => {
        throw new Error('Yandex Metrika error');
      });

      // Не должно выбросить исключение
      expect(() => {
        reachGoal('light_candle');
      }).not.toThrow();
    });

    it('работает в SSR окружении (window undefined)', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        reachGoal('light_candle');
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('hit', () => {
    it('отправляет виртуальный хит в Яндекс.Метрику', () => {
      hit('/candle/123', { title: 'Моя свеча' });

      expect(mockYm).toHaveBeenCalledWith(
        105780499,
        'hit',
        '/candle/123',
        { title: 'Моя свеча' }
      );
    });

    it('работает без параметров', () => {
      hit('/candle/123');

      expect(mockYm).toHaveBeenCalledWith(
        105780499,
        'hit',
        '/candle/123',
        undefined
      );
    });

    it('не вызывает ym, если window.ym не определен', () => {
      delete (global.window as any).ym;

      hit('/candle/123');

      expect(mockYm).not.toHaveBeenCalled();
    });

    it('обрабатывает ошибки gracefully', () => {
      mockYm.mockImplementation(() => {
        throw new Error('Yandex Metrika error');
      });

      expect(() => {
        hit('/candle/123');
      }).not.toThrow();
    });
  });

  describe('params', () => {
    it('отправляет параметры визита в Яндекс.Метрику', () => {
      params({ user_type: 'registered', plan: 'free' });

      expect(mockYm).toHaveBeenCalledWith(
        105780499,
        'params',
        { user_type: 'registered', plan: 'free' }
      );
    });

    it('не вызывает ym, если window.ym не определен', () => {
      delete (global.window as any).ym;

      params({ user_type: 'registered' });

      expect(mockYm).not.toHaveBeenCalled();
    });

    it('обрабатывает ошибки gracefully', () => {
      mockYm.mockImplementation(() => {
        throw new Error('Yandex Metrika error');
      });

      expect(() => {
        params({ user_type: 'registered' });
      }).not.toThrow();
    });
  });

  describe('YandexMetrikaGoals', () => {
    it('содержит все предопределенные цели', () => {
      expect(YandexMetrikaGoals.LIGHT_CANDLE).toBe('light_candle');
      expect(YandexMetrikaGoals.SIGN_UP).toBe('sign_up');
      expect(YandexMetrikaGoals.VIEW_CANDLE).toBe('view_candle');
      expect(YandexMetrikaGoals.VIEW_MAP).toBe('view_map');
      expect(YandexMetrikaGoals.VIEW_FAQ).toBe('view_faq');
      expect(YandexMetrikaGoals.SHARE_CANDLE).toBe('share_candle');
    });
  });
});


