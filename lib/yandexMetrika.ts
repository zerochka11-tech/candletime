/**
 * Утилиты для работы с Яндекс.Метрикой
 */

declare global {
  interface Window {
    ym?: (
      counterId: number,
      method: string,
      targetOrParams: string | Record<string, any>,
      params?: any
    ) => void
  }
}

const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '105780499'

/**
 * Отправляет цель (конверсию) в Яндекс.Метрику
 * 
 * @param target - Название цели (например, 'light_candle', 'sign_up')
 * @param params - Дополнительные параметры цели (опционально)
 * 
 * @example
 * ```typescript
 * reachGoal('light_candle', { candle_type: 'calm' });
 * ```
 */
export const reachGoal = (target: string, params?: any) => {
  if (typeof window !== 'undefined' && window.ym && YANDEX_METRIKA_ID) {
    try {
      window.ym(Number(YANDEX_METRIKA_ID), 'reachGoal', target, params)
    } catch (error) {
      console.error('Yandex Metrika reachGoal error:', error)
    }
  }
}

/**
 * Отправляет виртуальный хит (переход на страницу) в Яндекс.Метрику
 * 
 * @param url - URL страницы
 * @param params - Дополнительные параметры (опционально)
 * 
 * @example
 * ```typescript
 * hit('/candle/123', { title: 'Моя свеча' });
 * ```
 */
export const hit = (url: string, params?: any) => {
  if (typeof window !== 'undefined' && window.ym && YANDEX_METRIKA_ID) {
    try {
      window.ym(Number(YANDEX_METRIKA_ID), 'hit', url, params)
    } catch (error) {
      console.error('Yandex Metrika hit error:', error)
    }
  }
}

/**
 * Отправляет параметры визита в Яндекс.Метрику
 * 
 * @param params - Параметры визита (ключ-значение)
 * 
 * @example
 * ```typescript
 * params({ user_type: 'registered', plan: 'free' });
 * ```
 */
export const params = (params: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.ym && YANDEX_METRIKA_ID) {
    try {
      window.ym(Number(YANDEX_METRIKA_ID), 'params', params)
    } catch (error) {
      console.error('Yandex Metrika params error:', error)
    }
  }
}

/**
 * Предопределенные цели для удобства
 */
export const YandexMetrikaGoals = {
  // Зажигание свечи
  LIGHT_CANDLE: 'light_candle',
  // Регистрация
  SIGN_UP: 'sign_up',
  // Просмотр свечи
  VIEW_CANDLE: 'view_candle',
  // Просмотр карты
  VIEW_MAP: 'view_map',
  // Просмотр FAQ
  VIEW_FAQ: 'view_faq',
  // Поделиться свечой
  SHARE_CANDLE: 'share_candle',
} as const

