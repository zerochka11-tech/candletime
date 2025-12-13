# 🎨 План реализации визуальных эффектов и анимаций для свечей

**Дата создания:** 2025  
**Версия:** 1.0  
**Проект:** CandleTime - визуальные эффекты для символических свечей

---

## 📋 Содержание

1. [Обзор концепции](#обзор-концепции)
2. [Технический стек](#технический-стек)
3. [Архитектура решения](#архитектура-решения)
4. [Детальная реализация по типам свечей](#детальная-реализация-по-типам-свечей)
5. [Компоненты и структура кода](#компоненты-и-структура-кода)
6. [Пошаговая инструкция внедрения](#пошаговая-инструкция-внедрения)
7. [Оптимизация производительности](#оптимизация-производительности)
8. [Тестирование](#тестирование)

---

## 🎯 Обзор концепции

### Цель
Создать уникальные визуальные эффекты для каждого типа свечи, которые:
- Усиливают эмоциональную связь пользователя с намерением
- Делают сервис запоминающимся и уникальным
- Сохраняют минималистичную эстетику
- Работают плавно на всех устройствах

### Типы свечей и их визуальные характеристики

| Тип | Цветовая палитра | Характер анимации | Эффекты |
|-----|------------------|-------------------|---------|
| **Спокойствие** 🕊️ | Голубые, синие, белые оттенки | Мягкое мерцание, плавное движение | Легкие частицы, волны |
| **Поддержка** 🤝 | Теплые оранжевые, янтарные | Стабильное пламя, уверенное | Теплое свечение, мягкие искры |
| **Память** 🌙 | Фиолетовые, синие, темные | Медленное мерцание, задумчивое | Звездная пыль, лунный свет |
| **Благодарность** ✨ | Золотые, желтые, теплые | Яркое пламя, радостное | Золотые искры, сияние |
| **Фокус** 🎯 | Красные, оранжевые, концентрированные | Концентрированное пламя, интенсивное | Фокусные лучи, энергия |

---

## 🛠️ Технический стек

### Основные технологии:
- **React 19** - компоненты
- **Framer Motion** - анимации и переходы
- **Canvas API** - частицы и сложные эффекты
- **CSS Animations** - базовые анимации пламени
- **WebGL** (опционально) - для продвинутых 3D эффектов

### Зависимости для установки:
```bash
npm install framer-motion
# Canvas API встроен в браузер
# WebGL через Three.js (опционально, если нужны 3D эффекты)
```

---

## 🏗️ Архитектура решения

### Структура компонентов:

```
components/
  candle/
    CandleFlame.tsx          # Основной компонент пламени
    CandleParticles.tsx        # Система частиц
    CandleGlow.tsx            # Свечение вокруг свечи
    CandleAnimation.tsx       # Обертка с анимациями
  effects/
    ParticleSystem.tsx        # Универсальная система частиц
    GlowEffect.tsx            # Эффект свечения
    WaveEffect.tsx            # Волновые эффекты
  types/
    candleEffects.ts          # Типы и конфигурации
```

### Поток данных:

```
CandleType → EffectConfig → CandleAnimation → 
  ├─ CandleFlame (CSS/Canvas)
  ├─ CandleParticles (Canvas)
  └─ CandleGlow (CSS)
```

---

## 🎨 Детальная реализация по типам свечей

### 1. Спокойствие (Calm) 🕊️

**Визуальные характеристики:**
- Цвета: `#87CEEB` (небесно-голубой), `#B0E0E6` (порошковый), `#E0F6FF` (светло-голубой)
- Анимация: Мягкое дыхание, плавные волны
- Эффекты: Легкие частицы, похожие на снежинки или пузырьки

**Реализация:**

```typescript
// lib/candleEffects.ts
export const CALM_EFFECT_CONFIG = {
  flame: {
    primaryColor: '#87CEEB',
    secondaryColor: '#B0E0E6',
    glowColor: '#E0F6FF',
    animation: {
      duration: 3,
      easing: 'ease-in-out',
      intensity: 0.3, // Низкая интенсивность для спокойствия
    },
  },
  particles: {
    type: 'bubbles', // или 'snowflakes'
    count: 15,
    speed: 0.5,
    size: { min: 2, max: 6 },
    colors: ['#87CEEB', '#B0E0E6', '#E0F6FF'],
    opacity: 0.6,
  },
  glow: {
    intensity: 0.4,
    radius: 80,
    color: '#E0F6FF',
    pulse: true,
    pulseSpeed: 2,
  },
};
```

**CSS анимация пламени:**

```css
/* app/globals.css или отдельный файл */
@keyframes calm-flame {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.8;
  }
  25% {
    transform: scaleY(1.1) scaleX(0.95);
    opacity: 0.9;
  }
  50% {
    transform: scaleY(0.95) scaleX(1.05);
    opacity: 0.85;
  }
  75% {
    transform: scaleY(1.05) scaleX(0.98);
    opacity: 0.9;
  }
}

.calm-flame {
  animation: calm-flame 3s ease-in-out infinite;
  background: radial-gradient(
    ellipse at center,
    #87CEEB 0%,
    #B0E0E6 40%,
    transparent 70%
  );
}
```

---

### 2. Поддержка (Support) 🤝

**Визуальные характеристики:**
- Цвета: `#FF8C42` (оранжевый), `#FFA07A` (лососевый), `#FFD700` (золотой)
- Анимация: Стабильное, уверенное пламя
- Эффекты: Теплое свечение, мягкие искры

**Реализация:**

```typescript
export const SUPPORT_EFFECT_CONFIG = {
  flame: {
    primaryColor: '#FF8C42',
    secondaryColor: '#FFA07A',
    glowColor: '#FFD700',
    animation: {
      duration: 2.5,
      easing: 'ease-out',
      intensity: 0.6, // Средняя-высокая интенсивность
    },
    },
    particles: {
    type: 'sparks',
    count: 20,
    speed: 0.8,
    size: { min: 3, max: 8 },
    colors: ['#FF8C42', '#FFA07A', '#FFD700'],
    opacity: 0.7,
  },
  glow: {
    intensity: 0.6,
    radius: 100,
    color: '#FFD700',
    pulse: true,
    pulseSpeed: 1.5,
  },
};
```

**CSS анимация:**

```css
@keyframes support-flame {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.9;
  }
  33% {
    transform: scaleY(1.15) scaleX(0.92);
    opacity: 1;
  }
  66% {
    transform: scaleY(0.9) scaleX(1.08);
    opacity: 0.95;
  }
}

.support-flame {
  animation: support-flame 2.5s ease-out infinite;
  background: radial-gradient(
    ellipse at center,
    #FF8C42 0%,
    #FFA07A 35%,
    #FFD700 60%,
    transparent 75%
  );
}
```

---

### 3. Память (Memory) 🌙

**Визуальные характеристики:**
- Цвета: `#9370DB` (средний фиолетовый), `#4B0082` (индиго), `#191970` (полуночно-синий)
- Анимация: Медленное, задумчивое мерцание
- Эффекты: Звездная пыль, лунный свет

**Реализация:**

```typescript
export const MEMORY_EFFECT_CONFIG = {
  flame: {
    primaryColor: '#9370DB',
    secondaryColor: '#4B0082',
    glowColor: '#191970',
    animation: {
      duration: 4,
      easing: 'ease-in-out',
      intensity: 0.4, // Низкая интенсивность, медленное
    },
    },
    particles: {
    type: 'stars',
    count: 25,
      speed: 0.3,
    size: { min: 1, max: 4 },
    colors: ['#9370DB', '#4B0082', '#191970', '#FFFFFF'],
    opacity: 0.8,
    twinkle: true, // Мерцание звезд
  },
  glow: {
    intensity: 0.5,
    radius: 90,
    color: '#9370DB',
    pulse: true,
    pulseSpeed: 1, // Медленный пульс
  },
};
```

**CSS анимация:**

```css
@keyframes memory-flame {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 0.7;
    filter: blur(1px);
  }
  50% {
    transform: scaleY(1.05) scaleX(0.98);
    opacity: 0.85;
    filter: blur(0.5px);
  }
}

.memory-flame {
  animation: memory-flame 4s ease-in-out infinite;
  background: radial-gradient(
    ellipse at center,
    #9370DB 0%,
    #4B0082 45%,
    #191970 70%,
    transparent 85%
  );
}
```

---

### 4. Благодарность (Gratitude) ✨

**Визуальные характеристики:**
- Цвета: `#FFD700` (золотой), `#FFA500` (оранжевый), `#FFF8DC` (бежевый)
- Анимация: Яркое, радостное пламя
- Эффекты: Золотые искры, сияние

**Реализация:**

```typescript
export const GRATITUDE_EFFECT_CONFIG = {
  flame: {
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    glowColor: '#FFF8DC',
    animation: {
      duration: 2,
      easing: 'ease-in-out',
      intensity: 0.8, // Высокая интенсивность
    },
    },
    particles: {
    type: 'golden-sparks',
    count: 30,
    speed: 1.2,
    size: { min: 4, max: 10 },
    colors: ['#FFD700', '#FFA500', '#FFF8DC', '#FFFF00'],
    opacity: 0.9,
    sparkle: true, // Искрящийся эффект
  },
  glow: {
    intensity: 0.8,
    radius: 120,
    color: '#FFD700',
    pulse: true,
    pulseSpeed: 2,
  },
};
```

**CSS анимация:**

```css
@keyframes gratitude-flame {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 1;
  }
  25% {
    transform: scaleY(1.2) scaleX(0.9);
    opacity: 1;
  }
  50% {
    transform: scaleY(0.95) scaleX(1.1);
    opacity: 0.95;
  }
  75% {
    transform: scaleY(1.1) scaleX(0.95);
    opacity: 1;
  }
}

.gratitude-flame {
  animation: gratitude-flame 2s ease-in-out infinite;
  background: radial-gradient(
    ellipse at center,
    #FFD700 0%,
    #FFA500 30%,
    #FFF8DC 55%,
    transparent 75%
  );
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
}
```

---

### 5. Фокус (Focus) 🎯

**Визуальные характеристики:**
- Цвета: `#DC143C` (малиновый), `#FF4500` (оранжево-красный), `#FF6347` (томатный)
- Анимация: Концентрированное, интенсивное пламя
- Эффекты: Фокусные лучи, энергия

**Реализация:**

```typescript
export const FOCUS_EFFECT_CONFIG = {
  flame: {
    primaryColor: '#DC143C',
    secondaryColor: '#FF4500',
    glowColor: '#FF6347',
    animation: {
      duration: 1.5,
      easing: 'ease-out',
      intensity: 0.9, // Очень высокая интенсивность
    },
    },
    particles: {
    type: 'energy',
    count: 15,
    speed: 1.5,
    size: { min: 2, max: 6 },
    colors: ['#DC143C', '#FF4500', '#FF6347'],
    opacity: 0.8,
    direction: 'upward', // Частицы идут вверх
  },
  glow: {
    intensity: 0.7,
    radius: 70,
    color: '#DC143C',
    pulse: true,
    pulseSpeed: 3, // Быстрый пульс
    focus: true, // Концентрированное свечение
  },
};
```

**CSS анимация:**

```css
@keyframes focus-flame {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    opacity: 1;
    filter: blur(0px);
  }
  50% {
    transform: scaleY(1.3) scaleX(0.85);
    opacity: 1;
    filter: blur(0.5px);
  }
}

.focus-flame {
  animation: focus-flame 1.5s ease-out infinite;
  background: radial-gradient(
    ellipse at center,
    #DC143C 0%,
    #FF4500 25%,
    #FF6347 50%,
    transparent 70%
  );
  box-shadow: 0 0 15px rgba(220, 20, 60, 0.8);
}
```

---

## 💻 Компоненты и структура кода

### 1. Основной компонент CandleAnimation

```typescript
// components/candle/CandleAnimation.tsx
'use client';

import { motion } from 'framer-motion';
import { CandleFlame } from './CandleFlame';
import { CandleParticles } from './CandleParticles';
import { CandleGlow } from './CandleGlow';
import { getCandleEffectConfig } from '@/lib/candleEffects';

interface CandleAnimationProps {
  candleType: 'calm' | 'support' | 'memory' | 'gratitude' | 'focus';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean; // Реакция на hover/click
}

export function CandleAnimation({
  candleType,
  size = 'medium',
  interactive = true,
}: CandleAnimationProps) {
  const config = getCandleEffectConfig(candleType);
  const sizeClasses = {
    small: 'w-8 h-12',
    medium: 'w-12 h-20',
    large: 'w-16 h-28',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Свечение вокруг свечи */}
      <CandleGlow config={config.glow} size={size} />

      {/* Контейнер свечи */}
      <motion.div
        className={`relative ${sizeClasses[size]}`}
        whileHover={interactive ? { scale: 1.05 } : {}}
        whileTap={interactive ? { scale: 0.98 } : {}}
      >
        {/* Тело свечи */}
        <div className="absolute bottom-0 w-full h-3/4 bg-gradient-to-b from-slate-100 to-slate-200 rounded-t-lg border border-slate-300" />

        {/* Пламя */}
        <CandleFlame
          config={config.flame}
          candleType={candleType}
          size={size}
        />
      </motion.div>

      {/* Частицы */}
      <CandleParticles
        config={config.particles}
        candleType={candleType}
        size={size}
      />
    </div>
  );
}
```

---

### 2. Компонент пламени CandleFlame

```typescript
// components/candle/CandleFlame.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { FlameConfig } from '@/lib/candleEffects';

interface CandleFlameProps {
  config: FlameConfig;
  candleType: string;
  size: 'small' | 'medium' | 'large';
}

export function CandleFlame({ config, candleType, size }: CandleFlameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Размеры пламени в зависимости от размера свечи
    const flameSizes = {
      small: { width: 16, height: 24 },
      medium: { width: 24, height: 36 },
      large: { width: 32, height: 48 },
    };

    const { width, height } = flameSizes[size];
    canvas.width = width;
    canvas.height = height;

    let animationFrameId: number;
    let time = 0;

    const drawFlame = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Рисуем пламя с использованием градиентов
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.3,
        0,
        width / 2,
        height * 0.3,
        width / 2
      );

      gradient.addColorStop(0, config.primaryColor);
      gradient.addColorStop(0.5, config.secondaryColor);
      gradient.addColorStop(1, 'transparent');

      // Анимация пламени
      const wave = Math.sin(time * config.animation.duration) * 0.1;
      const intensity = 1 + wave * config.animation.intensity;

      ctx.save();
      ctx.translate(width / 2, height * 0.3);
      ctx.scale(1 + wave * 0.1, intensity);
      ctx.translate(-width / 2, -height * 0.3);

      // Рисуем форму пламени (капля)
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.bezierCurveTo(
        width / 2 + width * 0.3 * (1 + Math.sin(time) * 0.2),
        height * 0.3,
        width / 2 + width * 0.2 * (1 + Math.cos(time * 1.5) * 0.2),
        height * 0.7,
        width / 2,
        height
      );
      ctx.bezierCurveTo(
        width / 2 - width * 0.2 * (1 + Math.cos(time * 1.5) * 0.2),
        height * 0.7,
        width / 2 - width * 0.3 * (1 + Math.sin(time) * 0.2),
        height * 0.3,
        width / 2,
        0
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(drawFlame);
    };

    drawFlame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [config, size]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
```

---

### 3. Компонент частиц CandleParticles

```typescript
// components/candle/CandleParticles.tsx
'use client';

import { useEffect, useRef } from 'react';
import { ParticlesConfig } from '@/lib/candleEffects';

interface CandleParticlesProps {
  config: ParticlesConfig;
  candleType: string;
  size: 'small' | 'medium' | 'large';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export function CandleParticles({
  config,
  candleType,
  size,
}: CandleParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Размеры canvas
    const canvasSizes = {
      small: { width: 100, height: 150 },
      medium: { width: 150, height: 220 },
      large: { width: 200, height: 300 },
    };

    const { width, height } = canvasSizes[size];
    canvas.width = width;
    canvas.height = height;

    // Инициализация частиц
    const initParticles = () => {
      particlesRef.current = [];
      const centerX = width / 2;
      const centerY = height * 0.3; // Позиция пламени

      for (let i = 0; i < config.count; i++) {
        const angle = (Math.PI * 2 * i) / config.count;
        const speed = config.speed * (0.5 + Math.random() * 0.5);
        const particleSize =
          config.size.min + Math.random() * (config.size.max - config.size.min);

        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle)) * speed - 0.5, // Вверх
          size: particleSize,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          opacity: config.opacity,
            life: 1,
            maxLife: 1,
          });
      }
    };

    initParticles();

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016; // ~60fps

      const centerX = width / 2;
      const centerY = height * 0.3;

      particlesRef.current.forEach((particle, index) => {
        // Обновление позиции
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Гравитация и турбулентность
        particle.vy += 0.02;
        particle.vx += (Math.random() - 0.5) * 0.1;

        // Уменьшение жизни
        particle.life -= 0.01;
        particle.opacity = config.opacity * particle.life;

        // Мерцание для звезд
        if (config.twinkle) {
          particle.opacity *= 0.7 + Math.sin(time * 10 + index) * 0.3;
        }

        // Искрящийся эффект для благодарности
        if (config.sparkle) {
          particle.size = particle.size * (0.8 + Math.sin(time * 20 + index) * 0.2);
        }

        // Если частица ушла за границы или умерла, пересоздаем
        if (
          particle.life <= 0 ||
          particle.x < 0 ||
          particle.x > width ||
          particle.y < 0 ||
          particle.y > height
        ) {
          const angle = (Math.PI * 2 * Math.random());
          const speed = config.speed * (0.5 + Math.random() * 0.5);
          particle.x = centerX;
          particle.y = centerY;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = -Math.abs(Math.sin(angle)) * speed - 0.5;
          particle.life = 1;
          particle.size =
            config.size.min + Math.random() * (config.size.max - config.size.min);
          particle.color =
            config.colors[Math.floor(Math.random() * config.colors.length)];
        }

        // Рисуем частицу
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        // Разные формы в зависимости от типа
        if (config.type === 'stars') {
          // Рисуем звезду
        ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = particle.x + Math.cos(angle) * particle.size;
            const y = particle.y + Math.sin(angle) * particle.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        ctx.fill();
        } else {
          // Круг для остальных типов
      ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [config, size]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
```

---

### 4. Компонент свечения CandleGlow

```typescript
// components/candle/CandleGlow.tsx
'use client';

import { motion } from 'framer-motion';
import { GlowConfig } from '@/lib/candleEffects';

interface CandleGlowProps {
  config: GlowConfig;
  size: 'small' | 'medium' | 'large';
}

export function CandleGlow({ config, size }: CandleGlowProps) {
  const glowSizes = {
    small: 60,
    medium: 100,
    large: 140,
  };

  const radius = glowSizes[size] * (config.radius / 100);

  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
          style={{
        background: `radial-gradient(circle, ${config.color}${Math.round(config.intensity * 255).toString(16)} 0%, transparent 70%)`,
        width: radius * 2,
        height: radius * 2,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        filter: 'blur(10px)',
        }}
      animate={
        config.pulse
          ? {
              scale: [1, 1.1, 1],
              opacity: [config.intensity, config.intensity * 1.2, config.intensity],
            }
          : {}
      }
      transition={{
        duration: config.pulseSpeed,
        repeat: Infinity,
        ease: 'easeInOut',
          }}
        />
  );
}
```

---

### 5. Конфигурационный файл

```typescript
// lib/candleEffects.ts

export interface FlameConfig {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  animation: {
    duration: number;
    easing: string;
    intensity: number;
  };
}

export interface ParticlesConfig {
  type: 'bubbles' | 'sparks' | 'stars' | 'golden-sparks' | 'energy';
  count: number;
  speed: number;
  size: { min: number; max: number };
  colors: string[];
  opacity: number;
  twinkle?: boolean;
  sparkle?: boolean;
  direction?: 'upward' | 'radial';
}

export interface GlowConfig {
  intensity: number;
  radius: number;
  color: string;
  pulse: boolean;
  pulseSpeed: number;
  focus?: boolean;
}

export interface CandleEffectConfig {
  flame: FlameConfig;
  particles: ParticlesConfig;
  glow: GlowConfig;
}

export const CALM_EFFECT_CONFIG: CandleEffectConfig = {
  flame: {
    primaryColor: '#87CEEB',
    secondaryColor: '#B0E0E6',
    glowColor: '#E0F6FF',
    animation: {
      duration: 3,
      easing: 'ease-in-out',
      intensity: 0.3,
    },
  },
  particles: {
    type: 'bubbles',
    count: 15,
    speed: 0.5,
    size: { min: 2, max: 6 },
    colors: ['#87CEEB', '#B0E0E6', '#E0F6FF'],
    opacity: 0.6,
  },
  glow: {
    intensity: 0.4,
    radius: 80,
    color: '#E0F6FF',
    pulse: true,
    pulseSpeed: 2,
  },
};

export const SUPPORT_EFFECT_CONFIG: CandleEffectConfig = {
  flame: {
    primaryColor: '#FF8C42',
    secondaryColor: '#FFA07A',
    glowColor: '#FFD700',
    animation: {
      duration: 2.5,
      easing: 'ease-out',
      intensity: 0.6,
    },
  },
  particles: {
    type: 'sparks',
    count: 20,
    speed: 0.8,
    size: { min: 3, max: 8 },
    colors: ['#FF8C42', '#FFA07A', '#FFD700'],
    opacity: 0.7,
  },
  glow: {
    intensity: 0.6,
    radius: 100,
    color: '#FFD700',
    pulse: true,
    pulseSpeed: 1.5,
  },
};

export const MEMORY_EFFECT_CONFIG: CandleEffectConfig = {
  flame: {
    primaryColor: '#9370DB',
    secondaryColor: '#4B0082',
    glowColor: '#191970',
    animation: {
      duration: 4,
      easing: 'ease-in-out',
      intensity: 0.4,
    },
  },
  particles: {
    type: 'stars',
    count: 25,
    speed: 0.3,
    size: { min: 1, max: 4 },
    colors: ['#9370DB', '#4B0082', '#191970', '#FFFFFF'],
    opacity: 0.8,
    twinkle: true,
  },
  glow: {
    intensity: 0.5,
    radius: 90,
    color: '#9370DB',
    pulse: true,
    pulseSpeed: 1,
  },
};

export const GRATITUDE_EFFECT_CONFIG: CandleEffectConfig = {
  flame: {
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    glowColor: '#FFF8DC',
    animation: {
      duration: 2,
      easing: 'ease-in-out',
      intensity: 0.8,
    },
  },
  particles: {
    type: 'golden-sparks',
    count: 30,
    speed: 1.2,
    size: { min: 4, max: 10 },
    colors: ['#FFD700', '#FFA500', '#FFF8DC', '#FFFF00'],
    opacity: 0.9,
    sparkle: true,
  },
  glow: {
    intensity: 0.8,
    radius: 120,
    color: '#FFD700',
    pulse: true,
    pulseSpeed: 2,
  },
};

export const FOCUS_EFFECT_CONFIG: CandleEffectConfig = {
  flame: {
    primaryColor: '#DC143C',
    secondaryColor: '#FF4500',
    glowColor: '#FF6347',
    animation: {
      duration: 1.5,
      easing: 'ease-out',
      intensity: 0.9,
    },
  },
  particles: {
    type: 'energy',
    count: 15,
    speed: 1.5,
    size: { min: 2, max: 6 },
    colors: ['#DC143C', '#FF4500', '#FF6347'],
    opacity: 0.8,
    direction: 'upward',
  },
  glow: {
    intensity: 0.7,
    radius: 70,
    color: '#DC143C',
    pulse: true,
    pulseSpeed: 3,
    focus: true,
  },
};

export function getCandleEffectConfig(
  type: 'calm' | 'support' | 'memory' | 'gratitude' | 'focus'
): CandleEffectConfig {
  const configs = {
    calm: CALM_EFFECT_CONFIG,
    support: SUPPORT_EFFECT_CONFIG,
    memory: MEMORY_EFFECT_CONFIG,
    gratitude: GRATITUDE_EFFECT_CONFIG,
    focus: FOCUS_EFFECT_CONFIG,
  };

  return configs[type];
}
```

---

## 📝 Пошаговая инструкция внедрения

### Шаг 1: Установка зависимостей

```bash
npm install framer-motion
```

### Шаг 2: Создание структуры файлов

```bash
mkdir -p components/candle
mkdir -p components/effects
mkdir -p lib
```

### Шаг 3: Создание конфигурационного файла

1. Создать `lib/candleEffects.ts` с конфигурациями (код выше)

### Шаг 4: Создание компонентов

1. Создать `components/candle/CandleGlow.tsx`
2. Создать `components/candle/CandleFlame.tsx`
3. Создать `components/candle/CandleParticles.tsx`
4. Создать `components/candle/CandleAnimation.tsx`

### Шаг 5: Интеграция в существующие страницы

**Обновление страницы свечи (`app/candle/[id]/page.tsx`):**

```typescript
import { CandleAnimation } from '@/components/candle/CandleAnimation';

// В компоненте страницы свечи:
<CandleAnimation
  candleType={candle.candle_type || 'calm'}
  size="large"
  interactive={true}
/>
```

**Обновление страницы всех свечей (`app/candles/page.tsx`):**

```typescript
// В карточке свечи:
<CandleAnimation
  candleType={candle.candle_type || 'calm'}
  size="medium"
  interactive={true}
/>
```

**Обновление страницы зажигания (`app/light/page.tsx`):**

```typescript
// Превью свечи при выборе типа:
<CandleAnimation
  candleType={selectedType}
  size="medium"
  interactive={false}
/>
```

### Шаг 6: Добавление интерактивности (опционально)

```typescript
// components/candle/CandleAnimation.tsx
// Добавить обработчики событий:

const [isHovered, setIsHovered] = useState(false);
const [isClicked, setIsClicked] = useState(false);

// При hover - усиление пламени
// При click - вспышка эффектов
```

---

## ⚡ Оптимизация производительности

### 1. Ленивая загрузка компонентов

```typescript
// Использовать dynamic import для тяжелых компонентов
import dynamic from 'next/dynamic';

const CandleAnimation = dynamic(
  () => import('@/components/candle/CandleAnimation'),
  { ssr: false } // Отключить SSR для Canvas
);
```

### 2. Оптимизация Canvas

```typescript
// В компонентах с Canvas:
// - Использовать requestAnimationFrame правильно
// - Очищать canvas перед каждым кадром
// - Ограничивать количество частиц на слабых устройствах
// - Использовать will-change для оптимизации

const particleCount = isMobile ? config.count * 0.6 : config.count;
```

### 3. Отключение эффектов на слабых устройствах

```typescript
// lib/deviceDetection.ts
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Проверка по количеству ядер, памяти и т.д.
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  return hardwareConcurrency <= 2 || deviceMemory <= 2;
}

// В компонентах:
const shouldShowParticles = !isLowEndDevice();
```

### 4. Мемоизация конфигураций

```typescript
import { useMemo } from 'react';

const config = useMemo(
  () => getCandleEffectConfig(candleType),
  [candleType]
);
```

### 5. Управление анимациями при видимости

```typescript
// Останавливать анимации когда компонент не виден
import { useInView } from 'framer-motion';

const ref = useRef(null);
const isInView = useInView(ref, { once: false });

  useEffect(() => {
  if (!isInView) {
    // Пауза анимаций
  }
}, [isInView]);
```

---

## 🧪 Тестирование

### 1. Визуальное тестирование

- Проверить все типы свечей на разных размерах экрана
- Проверить плавность анимаций (60fps)
- Проверить на мобильных устройствах
- Проверить производительность с множеством свечей на странице

### 2. Функциональное тестирование

```typescript
// __tests__/CandleAnimation.test.tsx
import { render, screen } from '@testing-library/react';
import { CandleAnimation } from '@/components/candle/CandleAnimation';

describe('CandleAnimation', () => {
  it('renders calm candle correctly', () => {
    render(<CandleAnimation candleType="calm" />);
    // Проверки
  });

  it('handles interactive mode', () => {
    // Тесты интерактивности
  });
});
```

### 3. Производительность

- Lighthouse тесты
- Проверка FPS в DevTools
- Проверка использования памяти
- Проверка на слабых устройствах

---

## 🎨 Дополнительные улучшения

### 1. Реакция на движение мыши

```typescript
// Пламя следует за курсором (легко)
const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);
```

### 2. Звуковые эффекты (опционально)

```typescript
// Легкий звук потрескивания пламени
const playFlameSound = () => {
  const audio = new Audio('/sounds/flame-crackle.mp3');
  audio.volume = 0.1;
  audio.play().catch(() => {}); // Игнорируем ошибки автоплея
};
```

### 3. Темная тема

```typescript
// Адаптация эффектов под темную тему
const isDark = useTheme() === 'dark';

const adjustedConfig = {
  ...config,
  glow: {
    ...config.glow,
    intensity: isDark ? config.glow.intensity * 1.2 : config.glow.intensity,
  },
};
```

---

## 📊 Метрики успеха

### Технические метрики:
- ✅ FPS > 55 на средних устройствах
- ✅ Время загрузки компонента < 100ms
- ✅ Использование памяти < 50MB для 10 свечей
- ✅ Работает на устройствах с 2GB RAM

### Пользовательские метрики:
- ✅ Увеличение времени на странице свечи на 20%+
- ✅ Положительные отзывы о визуальных эффектах
- ✅ Увеличение конверсии создания свечей

---

## 🚀 План внедрения по фазам

### Фаза 1: Базовая реализация (1 неделя)
1. Установка зависимостей
2. Создание конфигураций
3. Базовые компоненты (Flame, Glow)
4. Интеграция в одну страницу (тест)

### Фаза 2: Частицы и эффекты (1 неделя)
1. Система частиц
2. Разные типы частиц
3. Оптимизация производительности
4. Интеграция во все страницы

### Фаза 3: Полировка (3-5 дней)
1. Интерактивность
2. Адаптация под устройства
3. Тестирование
4. Документация

---

## 💡 Идеи для будущих улучшений

1. **3D эффекты** - использование Three.js для объемных свечей
2. **Физика пламени** - более реалистичная симуляция
3. **Кастомные эффекты** - пользователи могут создавать свои
4. **Сезонные эффекты** - специальные эффекты для праздников
5. **AR режим** - свечи в дополненной реальности (далекое будущее)

---

**Последнее обновление:** 2025  
**Версия документа:** 1.0
**Статус:** Готов к реализации
