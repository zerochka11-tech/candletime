'use client';

/**
 * Компонент анимации снежинок на Canvas
 * 
 * Создан на основе анализа анимации снежинок с сайта Яндекс 360:
 * https://360.yandex.ru/novogodnevo26/
 * 
 * Особенности:
 * - Плавная анимация падающих снежинок
 * - Горизонтальное покачивание (эффект ветра)
 * - Вращение снежинок во время падения
 * - Настраиваемые параметры (количество, скорость, размер, цвет)
 * - Адаптивный размер canvas под размер окна
 * - Оптимизированная производительность с использованием requestAnimationFrame
 * 
 * @example
 * // Базовое использование
 * <Snowflakes />
 * 
 * @example
 * // Кастомная настройка
 * <Snowflakes 
 *   count={100} 
 *   speed={2} 
 *   minSize={1} 
 *   maxSize={4}
 *   color="rgba(200, 220, 255, 0.9)"
 * />
 */

import { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  angle: number;
  amplitude: number;
  rotation: number;
  rotationSpeed: number;
}

interface SnowflakesProps {
  /**
   * Количество снежинок
   * @default 50
   */
  count?: number;
  /**
   * Скорость падения (пикселей в секунду)
   * @default 1
   */
  speed?: number;
  /**
   * Минимальный размер снежинки
   * @default 1
   */
  minSize?: number;
  /**
   * Максимальный размер снежинки
   * @default 3
   */
  maxSize?: number;
  /**
   * Цвет снежинок
   * @default 'rgba(255, 255, 255, 0.8)'
   */
  color?: string;
  /**
   * Включить горизонтальное покачивание
   * @default true
   */
  wind?: boolean;
  /**
   * z-index для canvas
   * @default 1
   */
  zIndex?: number;
  /**
   * Включить вращение снежинок
   * @default true
   */
  rotation?: boolean;
}

export default function Snowflakes({
  count = 50,
  speed = 1,
  minSize = 1,
  maxSize = 3,
  color = 'rgba(255, 255, 255, 0.8)',
  wind = true,
  zIndex = 1,
  rotation = true,
}: SnowflakesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const snowflakesRef = useRef<Snowflake[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Установка размеров canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Инициализация снежинок
    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < count; i++) {
        snowflakesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: minSize + Math.random() * (maxSize - minSize),
          speed: speed * (0.5 + Math.random() * 0.5),
          opacity: 0.5 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          amplitude: wind ? 0.5 + Math.random() * 1.5 : 0,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: rotation ? (Math.random() - 0.5) * 0.02 : 0,
        });
      }
    };

    initSnowflakes();

    // Функция отрисовки снежинки
    const drawSnowflake = (snowflake: Snowflake) => {
      ctx.save();
      ctx.translate(snowflake.x, snowflake.y);
      
      if (rotation) {
        ctx.rotate(snowflake.rotation);
      }

      // Рисуем снежинку в виде звезды
      const spikes = 6;
      const outerRadius = snowflake.radius;
      const innerRadius = snowflake.radius * 0.5;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Градиент для более реалистичного вида
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
      const colorWithOpacity = (opacity: number) => {
        if (color.includes('rgba')) {
          return color.replace(/[\d.]+(?=\))/, opacity.toString());
        } else if (color.includes('rgb')) {
          return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        } else {
          // Для hex или других форматов используем rgba
          return `rgba(255, 255, 255, ${opacity})`;
        }
      };
      
      gradient.addColorStop(0, colorWithOpacity(snowflake.opacity));
      gradient.addColorStop(1, colorWithOpacity(snowflake.opacity * 0.3));

      ctx.fillStyle = gradient;
      ctx.fill();

      // Добавляем центральную точку
      ctx.beginPath();
      ctx.arc(0, 0, snowflake.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = colorWithOpacity(snowflake.opacity);
      ctx.fill();

      ctx.restore();
    };

    // Функция отрисовки
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((snowflake) => {
        // Обновление позиции
        snowflake.y += snowflake.speed;

        // Горизонтальное покачивание (ветер)
        if (wind) {
          snowflake.angle += 0.01;
          snowflake.x += Math.sin(snowflake.angle) * snowflake.amplitude;
        }

        // Вращение
        if (rotation) {
          snowflake.rotation += snowflake.rotationSpeed;
        }

        // Если снежинка упала вниз, перемещаем её наверх
        if (snowflake.y > canvas.height + snowflake.radius) {
          snowflake.y = -snowflake.radius;
          snowflake.x = Math.random() * canvas.width;
        }

        // Если снежинка вышла за границы по горизонтали, возвращаем её
        if (snowflake.x < -snowflake.radius) {
          snowflake.x = canvas.width + snowflake.radius;
        } else if (snowflake.x > canvas.width + snowflake.radius) {
          snowflake.x = -snowflake.radius;
        }

        // Отрисовка снежинки
        drawSnowflake(snowflake);
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [count, speed, minSize, maxSize, color, wind, rotation]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{ zIndex }}
    />
  );
}

