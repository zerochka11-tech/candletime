/**
 * Примеры использования компонента Snowflakes
 * 
 * Компонент создан на основе анимации снежинок с сайта Яндекс 360
 * https://360.yandex.ru/novogodnevo26/
 */

import Snowflakes from './Snowflakes';

// Пример 1: Базовое использование (по умолчанию)
export function BasicExample() {
  return <Snowflakes />;
}

// Пример 2: Настройка количества и скорости
export function CustomExample() {
  return (
    <Snowflakes
      count={100}
      speed={2}
      minSize={1}
      maxSize={4}
    />
  );
}

// Пример 3: Снежинки с кастомным цветом
export function ColoredExample() {
  return (
    <Snowflakes
      count={75}
      color="rgba(200, 220, 255, 0.9)"
      speed={1.5}
    />
  );
}

// Пример 4: Без ветра и вращения (прямое падение)
export function StraightFallExample() {
  return (
    <Snowflakes
      count={50}
      wind={false}
      rotation={false}
    />
  );
}

// Пример 5: Интенсивная метель
export function BlizzardExample() {
  return (
    <Snowflakes
      count={200}
      speed={3}
      minSize={2}
      maxSize={5}
      wind={true}
      rotation={true}
      zIndex={10}
    />
  );
}

// Пример 6: Легкий снегопад
export function LightSnowExample() {
  return (
    <Snowflakes
      count={30}
      speed={0.5}
      minSize={0.5}
      maxSize={2}
      color="rgba(255, 255, 255, 0.6)"
    />
  );
}

/**
 * Использование в layout или на странице:
 * 
 * import Snowflakes from '@/components/Snowflakes';
 * 
 * export default function MyPage() {
 *   return (
 *     <>
 *       <Snowflakes count={50} speed={1} />
 *       <div>Ваш контент</div>
 *     </>
 *   );
 * }
 */

