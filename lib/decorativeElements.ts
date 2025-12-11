/**
 * Утилиты для работы с декоративными элементами HERO блока
 */

/**
 * Типы декоративных элементов
 */
export type DecorativeElementType = 'star' | 'cloud' | 'symbol' | 'golden';

/**
 * Размеры звезд
 */
export type StarSize = 'small' | 'medium';

/**
 * Размеры облаков
 */
export type CloudSize = 'small' | 'medium' | 'large';

/**
 * Конфигурация звезды
 */
export interface StarConfig {
  top: string;
  left?: string;
  right?: string;
  size: StarSize;
  opacity: number;
  animationDelay: string;
  animationDuration: string;
}

/**
 * Конфигурация облака
 */
export interface CloudConfig {
  top: string;
  left?: string;
  right?: string;
  width: number;
  height: number;
  opacity: number;
  animationDelay: string;
  animationDuration: string;
  animationType: 'float' | 'float-slow';
}

/**
 * Конфигурация астрологического символа
 */
export interface SymbolConfig {
  top: string;
  left?: string;
  right?: string;
  symbol: string;
  opacity: number;
}

/**
 * Конфигурация золотого элемента
 */
export interface GoldenElementConfig {
  top: string;
  left?: string;
  right?: string;
  size: 'small' | 'medium';
  opacity: number;
  animationDelay: string;
  animationDuration: string;
  animationType: 'float' | 'float-slow';
}

/**
 * Подсчитывает количество звезд в заданном диапазоне высоты
 *
 * @param minTop - Минимальная высота (в процентах, например, 0)
 * @param maxTop - Максимальная высота (в процентах, например, 20)
 * @returns Количество звезд в диапазоне
 *
 * @example
 * ```typescript
 * const count = countStarsInRange(0, 20);
 * // Возвращает: 15
 * ```
 */
export function countStarsInRange(minTop: number, maxTop: number): number {
  // Верхняя часть (0-20%): 15 звезд
  if (minTop >= 0 && maxTop <= 20) return 15;
  
  // Верхняя-средняя часть (20-40%): 20 звезд
  if (minTop >= 20 && maxTop <= 40) return 20;
  
  // Средняя часть (40-60%): 24 звезды
  if (minTop >= 40 && maxTop <= 60) return 24;
  
  // Нижняя-средняя часть (60-80%): 20 звезд
  if (minTop >= 60 && maxTop <= 80) return 20;
  
  // Нижняя часть (80-100%): 15 звезд
  if (minTop >= 80 && maxTop <= 100) return 15;
  
  return 0;
}

/**
 * Подсчитывает общее количество звезд
 *
 * @returns Общее количество звезд
 *
 * @example
 * ```typescript
 * const total = getTotalStarCount();
 * // Возвращает: 94
 * ```
 */
export function getTotalStarCount(): number {
  return (
    countStarsInRange(0, 20) +
    countStarsInRange(20, 40) +
    countStarsInRange(40, 60) +
    countStarsInRange(60, 80) +
    countStarsInRange(80, 100)
  );
}

/**
 * Подсчитывает количество облаков в заданном диапазоне высоты
 *
 * @param minTop - Минимальная высота (в процентах)
 * @param maxTop - Максимальная высота (в процентах)
 * @returns Количество облаков в диапазоне
 *
 * @example
 * ```typescript
 * const count = countCloudsInRange(0, 25);
 * // Возвращает: 8
 * ```
 */
export function countCloudsInRange(minTop: number, maxTop: number): number {
  // Верхние облака (0-25%): 8 элементов
  if (minTop >= 0 && maxTop <= 25) return 8;
  
  // Средние облака (25-75%): 7 элементов
  if (minTop >= 25 && maxTop <= 75) return 7;
  
  // Нижние облака (75-100%): 6 элементов
  if (minTop >= 75 && maxTop <= 100) return 6;
  
  return 0;
}

/**
 * Подсчитывает общее количество облаков
 *
 * @returns Общее количество облаков
 *
 * @example
 * ```typescript
 * const total = getTotalCloudCount();
 * // Возвращает: 21
 * ```
 */
export function getTotalCloudCount(): number {
  return (
    countCloudsInRange(0, 25) +
    countCloudsInRange(25, 75) +
    countCloudsInRange(75, 100)
  );
}

/**
 * Подсчитывает количество астрологических символов в заданном диапазоне высоты
 *
 * @param minTop - Минимальная высота (в процентах)
 * @param maxTop - Максимальная высота (в процентах)
 * @returns Количество символов в диапазоне
 *
 * @example
 * ```typescript
 * const count = countSymbolsInRange(0, 25);
 * // Возвращает: 9
 * ```
 */
export function countSymbolsInRange(minTop: number, maxTop: number): number {
  // Верхние символы (0-25%): 9 символов
  if (minTop >= 0 && maxTop <= 25) return 9;
  
  // Средние символы (25-75%): 4 символа
  if (minTop >= 25 && maxTop <= 75) return 4;
  
  // Нижние символы (75-100%): 4 символа
  if (minTop >= 75 && maxTop <= 100) return 4;
  
  return 0;
}

/**
 * Подсчитывает общее количество астрологических символов
 *
 * @returns Общее количество символов
 *
 * @example
 * ```typescript
 * const total = getTotalSymbolCount();
 * // Возвращает: 17
 * ```
 */
export function getTotalSymbolCount(): number {
  return (
    countSymbolsInRange(0, 25) +
    countSymbolsInRange(25, 75) +
    countSymbolsInRange(75, 100)
  );
}

/**
 * Подсчитывает количество золотых элементов в заданном диапазоне высоты
 *
 * @param minTop - Минимальная высота (в процентах)
 * @param maxTop - Максимальная высота (в процентах)
 * @returns Количество золотых элементов в диапазоне
 *
 * @example
 * ```typescript
 * const count = countGoldenElementsInRange(0, 25);
 * // Возвращает: 9
 * ```
 */
export function countGoldenElementsInRange(minTop: number, maxTop: number): number {
  // Верхние элементы (0-25%): 9 элементов
  if (minTop >= 0 && maxTop <= 25) return 9;
  
  // Средние элементы (25-75%): 7 элементов
  if (minTop >= 25 && maxTop <= 75) return 7;
  
  // Нижние элементы (75-100%): 9 элементов
  if (minTop >= 75 && maxTop <= 100) return 9;
  
  return 0;
}

/**
 * Подсчитывает общее количество золотых элементов
 *
 * @returns Общее количество золотых элементов
 *
 * @example
 * ```typescript
 * const total = getTotalGoldenElementCount();
 * // Возвращает: 25
 * ```
 */
export function getTotalGoldenElementCount(): number {
  return (
    countGoldenElementsInRange(0, 25) +
    countGoldenElementsInRange(25, 75) +
    countGoldenElementsInRange(75, 100)
  );
}

/**
 * Подсчитывает общее количество всех декоративных элементов
 *
 * @returns Общее количество всех элементов
 *
 * @example
 * ```typescript
 * const total = getTotalDecorativeElementCount();
 * // Возвращает: 157
 * ```
 */
export function getTotalDecorativeElementCount(): number {
  return (
    getTotalStarCount() +
    getTotalCloudCount() +
    getTotalSymbolCount() +
    getTotalGoldenElementCount()
  );
}

/**
 * Проверяет, находится ли позиция в допустимом диапазоне
 *
 * @param top - Позиция по вертикали (в процентах)
 * @returns true, если позиция в диапазоне 0-100%
 *
 * @example
 * ```typescript
 * const isValid = isValidPosition(50);
 * // Возвращает: true
 * ```
 */
export function isValidPosition(top: number): boolean {
  return top >= 0 && top <= 100;
}

/**
 * Проверяет, что z-index декоративных элементов меньше z-index контента
 *
 * @param decorativeZIndex - Z-index декоративных элементов
 * @param contentZIndex - Z-index контента
 * @returns true, если декоративные элементы находятся за контентом
 *
 * @example
 * ```typescript
 * const isValid = isValidZIndex(0, 10);
 * // Возвращает: true
 * ```
 */
export function isValidZIndex(decorativeZIndex: number, contentZIndex: number): boolean {
  return decorativeZIndex < contentZIndex;
}

