# 🤖 План реализации Telegram бота для CandleTime

**Дата создания:** Январь 2025  
**Версия:** 1.0  
**Проект:** CandleTime - спокойный сервис для символических свечей

---

## 📋 Содержание

1. [Анализ текущей системы](#анализ-текущей-системы)
2. [Архитектура решения](#архитектура-решения)
3. [Технический стек](#технический-стек)
4. [Структура проекта](#структура-проекта)
5. [Функциональность бота](#функциональность-бота)
6. [Интеграция с Supabase](#интеграция-с-supabase)
7. [Безопасность](#безопасность)
8. [План реализации](#план-реализации)
9. [Деплой и настройка](#деплой-и-настройка)

---

## 🔍 Анализ текущей системы

### Текущая структура создания свечей

#### Поля свечи (из БД):
- `id` (UUID, PRIMARY KEY) - генерируется автоматически
- `title` (TEXT, NOT NULL) - название свечи (обязательно, макс 100 символов)
- `message` (TEXT) - сообщение к свече (опционально, макс 500 символов)
- `created_at` (TIMESTAMPTZ) - дата создания (автоматически)
- `expires_at` (TIMESTAMPTZ, NOT NULL) - дата истечения (вычисляется из duration_hours)
- `status` (TEXT, DEFAULT 'active') - статус свечи
- `is_anonymous` (BOOLEAN, DEFAULT false) - анонимная ли свеча
- `candle_type` (TEXT) - тип свечи: calm, support, memory, gratitude, focus
- `duration_hours` (INTEGER) - длительность в часах: 1, 24, 168
- `user_id` (UUID) - ID пользователя (null для анонимных)

#### Геолокация (опционально):
- `location_type` (TEXT) - precise, city, country, region, none
- `location_country` (TEXT)
- `location_city` (TEXT)
- `location_region` (TEXT)
- `location_latitude` (DECIMAL(10, 8))
- `location_longitude` (DECIMAL(11, 8))
- `location_anonymized_lat` (DECIMAL(10, 8)) - автоматически через триггер
- `location_anonymized_lng` (DECIMAL(11, 8)) - автоматически через триггер
- `location_show_on_map` (BOOLEAN, DEFAULT true)
- `location_address` (TEXT)

#### RLS политики:
- ✅ Чтение для всех (публичный доступ)
- ✅ Создание для всех (включая анонимных) - **важно для бота!**
- ✅ Обновление только для владельца
- ✅ Удаление только для владельца

#### Триггеры:
- ✅ Автоматическая анонимизация координат при создании/обновлении

### Типы свечей:
1. **Спокойствие** (calm) 🕊️
2. **Поддержка** (support) 🤝
3. **Память** (memory) 🌙
4. **Благодарность** (gratitude) ✨
5. **Фокус** (focus) 🎯

### Длительность:
- 1 час
- 24 часа
- 7 дней (168 часов)

### Шаблоны:
- 5 общих шаблонов
- 10 IT-тематических шаблонов

---

## 🏗 Архитектура решения

### Варианты архитектуры:

#### Вариант 1: Отдельный сервис (рекомендуется) ⭐⭐⭐
**Преимущества:**
- Независимость от основного приложения
- Легче масштабировать
- Можно использовать разные технологии
- Не влияет на производительность сайта

**Недостатки:**
- Нужен отдельный хостинг
- Дополнительные расходы

#### Вариант 2: API Route в Next.js ⭐⭐

**Концепция:** Telegram бот работает как часть Next.js приложения через API Routes. Telegram Bot API отправляет webhook на специальный endpoint, который обрабатывает обновления.

**Преимущества:**
- ✅ Все в одном проекте - не нужно поддерживать отдельный сервис
- ✅ Проще деплой - один проект на Vercel
- ✅ Нет дополнительных расходов - использует существующий хостинг
- ✅ Общий код - можно переиспользовать утилиты и типы
- ✅ Единая база данных - прямой доступ к Supabase
- ✅ Проще разработка - все в одном репозитории

**Недостатки:**
- ⚠️ Зависимость от основного приложения - если сайт падает, бот тоже не работает
- ⚠️ Может влиять на производительность - обработка webhook может замедлить сайт
- ⚠️ Сложнее масштабировать - нужно масштабировать весь проект
- ⚠️ Ограничения Vercel - timeout для функций (10 секунд на Hobby плане)
- ⚠️ Cold start - первое обращение может быть медленным
- ⚠️ Сложнее отладка - логи смешаны с логами сайта

**Когда использовать:**
- Небольшой проект с низкой нагрузкой
- Нужна быстрая реализация без дополнительной инфраструктуры
- Бюджет ограничен
- Бот используется редко

**Архитектура:**

```
Telegram Bot API
    ↓ (webhook)
Next.js API Route (/api/telegram/webhook)
    ↓
Telegram Bot Handler (Telegraf)
    ↓
Supabase Client (общий с сайтом)
    ↓
PostgreSQL Database (candles table)
    ↓
Next.js Website (отображение свечей)
```

**Структура проекта:**

```
online-candles/
├── app/
│   ├── api/
│   │   └── telegram/
│   │       └── webhook/
│   │           └── route.ts        # Webhook endpoint
│   └── ...
├── lib/
│   ├── telegram/
│   │   ├── bot.ts                  # Инициализация бота
│   │   ├── commands.ts             # Обработчики команд
│   │   ├── handlers.ts             # Обработчики сообщений
│   │   └── keyboards.ts            # Клавиатуры
│   └── ...
└── ...
```

**Реализация:**

##### 1. Установка зависимостей

```bash
npm install telegraf
npm install --save-dev @types/node
```

##### 2. Создание бота

```typescript
// lib/telegram/bot.ts
import { Telegraf } from 'telegraf';
import { setupCommands } from './commands';
import { setupHandlers } from './handlers';

let botInstance: Telegraf | null = null;

export function getBot(): Telegraf {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    
    botInstance = new Telegraf(token);
    
    // Настройка команд и обработчиков
    setupCommands(botInstance);
    setupHandlers(botInstance);
    
    // Обработка ошибок
    botInstance.catch((err, ctx) => {
      console.error(`Error for ${ctx.updateType}:`, err);
      ctx.reply('Произошла ошибка. Попробуй еще раз.').catch(console.error);
    });
  }
  
  return botInstance;
}

// Для разработки - запуск polling
if (process.env.NODE_ENV === 'development' && process.env.TELEGRAM_USE_POLLING === 'true') {
  const bot = getBot();
  bot.launch();
  console.log('Telegram bot started in polling mode');
  
  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
```

##### 3. API Route для webhook

```typescript
// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '@/lib/telegram/bot';

// Отключаем body parsing для webhook (Telegraf обработает сам)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const bot = getBot();
    const body = await request.json();
    
    // Обработка обновления через Telegraf
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET для проверки webhook (Telegram проверяет доступность)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

##### 4. Настройка команд

```typescript
// lib/telegram/commands.ts
import { Telegraf } from 'telegraf';
import { handleLightCommand } from './commands/light';
import { handleMyCandlesCommand } from './commands/myCandles';

export function setupCommands(bot: Telegraf) {
  bot.command('start', async (ctx) => {
    await ctx.reply(
      `🕯️ Добро пожаловать в CandleTime!\n\n` +
      `Я помогу тебе зажечь символическую свечу прямо из Telegram.\n\n` +
      `Доступные команды:\n` +
      `/light - Зажечь свечу\n` +
      `/my_candles - Мои свечи\n` +
      `/help - Помощь\n\n` +
      `Начни с команды /light`
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 Помощь по использованию бота:\n\n` +
      `/light - Создать новую свечу\n` +
      `/my_candles - Посмотреть мои свечи\n` +
      `/cancel - Отменить текущее действие\n\n` +
      `Для создания свечи используй команду /light`
    );
  });

  bot.command('light', handleLightCommand);
  bot.command('my_candles', handleMyCandlesCommand);
  
  bot.command('cancel', async (ctx) => {
    // Очистка состояния пользователя
    await ctx.reply('❌ Действие отменено');
  });
}
```

##### 5. Переменные окружения

```env
# .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here  # Опционально, для безопасности
TELEGRAM_USE_POLLING=false  # true только для локальной разработки
```

##### 6. Настройка webhook (один раз)

```typescript
// scripts/setup-webhook.ts
// Запустить один раз после деплоя: npm run setup-webhook

import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/telegram/webhook`;

async function setupWebhook() {
  try {
    await bot.telegram.setWebhook(webhookUrl);
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('Webhook установлен:', webhookInfo.url);
    console.log('Webhook info:', JSON.stringify(webhookInfo, null, 2));
  } catch (error) {
    console.error('Ошибка установки webhook:', error);
    process.exit(1);
  }
}

setupWebhook();
```

Добавить в `package.json`:
```json
{
  "scripts": {
    "setup-webhook": "tsx scripts/setup-webhook.ts"
  }
}
```

##### 7. Безопасность webhook

```typescript
// app/api/telegram/webhook/route.ts (улучшенная версия)
import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '@/lib/telegram/bot';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Опциональная проверка секрета (если настроен)
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-telegram-bot-api-secret-token');
      if (signature !== webhookSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const bot = getBot();
    const body = await request.json();
    
    // Проверка, что это обновление от Telegram
    if (!body.update_id) {
      return NextResponse.json(
        { error: 'Invalid update' },
        { status: 400 }
      );
    }
    
    // Обработка обновления (асинхронно, не ждем завершения)
    bot.handleUpdate(body).catch((error) => {
      console.error('Error handling update:', error);
    });
    
    // Сразу возвращаем ответ Telegram (acknowledgment)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

##### 8. Обработка состояния пользователей

```typescript
// lib/telegram/state.ts
// Хранилище состояния пользователей (в памяти или Redis для продакшена)

interface UserState {
  step: 'type' | 'title' | 'message' | 'duration' | 'anonymous' | 'location' | 'confirm';
  data: {
    type?: string;
    title?: string;
    message?: string;
    duration?: number;
    is_anonymous?: boolean;
    location?: any;
  };
  timestamp: number;
}

// В памяти (для простоты, в продакшене лучше Redis)
const userStates = new Map<number, UserState>();

// Очистка старых состояний (старше 1 часа)
setInterval(() => {
  const now = Date.now();
  for (const [userId, state] of userStates.entries()) {
    if (now - state.timestamp > 60 * 60 * 1000) {
      userStates.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Каждые 5 минут

export function getUserState(userId: number): UserState | undefined {
  return userStates.get(userId);
}

export function setUserState(userId: number, state: Partial<UserState>): void {
  const existing = userStates.get(userId);
  userStates.set(userId, {
    ...existing,
    ...state,
    timestamp: Date.now(),
  } as UserState);
}

export function clearUserState(userId: number): void {
  userStates.delete(userId);
}
```

##### 9. Ограничения Vercel и решения

**Проблема:** Vercel Functions имеют timeout:
- Hobby: 10 секунд
- Pro: 60 секунд
- Enterprise: 300 секунд

**Решение 1:** Быстрый ответ, асинхронная обработка

```typescript
export async function POST(request: NextRequest) {
  const bot = getBot();
  const body = await request.json();
  
  // Сразу отвечаем Telegram
  const response = NextResponse.json({ ok: true });
  
  // Обрабатываем асинхронно (не блокируем ответ)
  setImmediate(async () => {
    try {
      await bot.handleUpdate(body);
    } catch (error) {
      console.error('Error handling update:', error);
    }
  });
  
  return response;
}
```

**Решение 2:** Использовать Vercel Queue (если доступно)

```typescript
import { Queue } from '@vercel/queue';

const queue = new Queue();

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Добавляем в очередь для обработки
  await queue.enqueue('telegram-update', body);
  
  return NextResponse.json({ ok: true });
}
```

**Решение 3:** Использовать Edge Runtime (ограниченная функциональность)

```typescript
export const runtime = 'edge';

// Но Telegraf может не работать в Edge Runtime
// Нужно использовать более легковесную библиотеку
```

##### 10. Мониторинг и логирование

```typescript
// lib/telegram/logger.ts
export function logBotEvent(event: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[BOT] ${timestamp} ${event}`, data || '');
  
  // Можно отправлять в внешний сервис логирования
  // Например, Sentry, LogRocket и т.д.
}

// Использование
bot.command('light', async (ctx) => {
  logBotEvent('command_light', { userId: ctx.from?.id });
  // ...
});
```

##### 11. Тестирование

```typescript
// __tests__/telegram/bot.test.ts
import { getBot } from '@/lib/telegram/bot';

describe('Telegram Bot', () => {
  it('should respond to /start command', async () => {
    const bot = getBot();
    const ctx = createMockContext('/start');
    await bot.handleUpdate(ctx.update);
    expect(ctx.reply).toHaveBeenCalled();
  });
});
```

##### 12. Деплой на Vercel

**Шаги:**
1. Добавить переменные окружения в Vercel:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET` (опционально)

2. После деплоя установить webhook:
   ```bash
   npm run setup-webhook
   ```

3. Проверить webhook:
   ```bash
   curl https://your-site.vercel.app/api/telegram/webhook
   ```

**Проверка работы:**
- Отправить `/start` боту в Telegram
- Проверить логи в Vercel Dashboard
- Убедиться, что свечи создаются на сайте

##### 13. Сравнение с Вариантом 1

| Критерий | Вариант 1 (Отдельный сервис) | Вариант 2 (API Route) |
|----------|------------------------------|----------------------|
| **Сложность настройки** | Средняя | Низкая |
| **Стоимость** | Дополнительный хостинг | Бесплатно (на Vercel) |
| **Производительность** | Высокая | Средняя (зависит от Vercel) |
| **Масштабируемость** | Легко масштабировать | Ограничено Vercel |
| **Независимость** | Полная | Зависит от сайта |
| **Отладка** | Проще | Сложнее (логи смешаны) |
| **Timeout** | Нет ограничений | 10-60 секунд (Vercel) |
| **Cold start** | Минимальный | Может быть заметен |

**Рекомендация:** 
- **Вариант 1** - для продакшена с высокой нагрузкой
- **Вариант 2** - для быстрого прототипа или небольшого проекта

**Гибридный подход:**
Можно начать с Варианта 2, а при росте нагрузки мигрировать на Вариант 1.

### Архитектура бота:

```
Telegram Bot API
    ↓
Telegram Bot Server (Node.js/TypeScript)
    ↓
Supabase Client
    ↓
PostgreSQL Database (candles table)
    ↓
Next.js Website (отображение свечей)
```

### Поток данных:

```
1. Пользователь отправляет команду в Telegram
2. Telegram Bot API отправляет webhook/update
3. Бот обрабатывает команду
4. Бот валидирует данные
5. Бот создает свечу через Supabase
6. Supabase сохраняет свечу в БД
7. Триггер анонимизирует координаты (если есть)
8. Свеча отображается на сайте
```

---

## 🛠 Технический стек

### Рекомендуемый стек:

#### Backend:
- **Node.js 20+** - runtime
- **TypeScript** - типизация
- **Telegraf** - фреймворк для Telegram ботов
- **@supabase/supabase-js** - клиент Supabase
- **dotenv** - переменные окружения
- **zod** - валидация данных

#### Дополнительные библиотеки:
- **node-telegram-bot-api** (альтернатива Telegraf)
- **axios** - HTTP запросы (если нужно)
- **winston** или **pino** - логирование

#### Хостинг:
- **Railway** - простой деплой, бесплатный тариф
- **Render** - простой деплой, бесплатный тариф
- **Heroku** - классический вариант (платный)
- **VPS** (DigitalOcean, Hetzner) - полный контроль

---

## 📁 Структура проекта

### Предлагаемая структура:

```
telegram-bot/
├── src/
│   ├── bot/
│   │   ├── index.ts              # Точка входа бота
│   │   ├── commands.ts           # Обработчики команд
│   │   ├── handlers.ts            # Обработчики сообщений
│   │   └── keyboards.ts           # Клавиатуры
│   ├── services/
│   │   ├── supabase.ts           # Клиент Supabase
│   │   ├── candle.ts              # Логика создания свечей
│   │   └── validation.ts          # Валидация данных
│   ├── types/
│   │   ├── candle.ts              # Типы свечей
│   │   └── bot.ts                 # Типы бота
│   ├── utils/
│   │   ├── logger.ts              # Логирование
│   │   └── helpers.ts             # Вспомогательные функции
│   └── config/
│       └── constants.ts           # Константы
├── .env.example                   # Пример переменных окружения
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Функциональность бота

### Команды бота:

#### 1. `/start` - Приветствие
**Описание:** Приветственное сообщение с инструкцией

**Ответ:**
```
🕯️ Добро пожаловать в CandleTime!

Я помогу тебе зажечь символическую свечу прямо из Telegram.

Доступные команды:
/light - Зажечь свечу
/my_candles - Мои свечи
/help - Помощь

Начни с команды /light
```

#### 2. `/light` - Создать свечу
**Описание:** Основная команда для создания свечи

**Поток:**
1. Бот спрашивает тип свечи (inline keyboard)
2. Бот спрашивает название свечи
3. Бот спрашивает сообщение (опционально, можно пропустить)
4. Бот спрашивает длительность (inline keyboard)
5. Бот спрашивает анонимность (inline keyboard)
6. Бот спрашивает геолокацию (опционально, можно пропустить)
7. Бот показывает превью и подтверждение
8. Бот создает свечу и отправляет ссылку

#### 3. `/my_candles` - Мои свечи
**Описание:** Показывает последние свечи пользователя

**Функционал:**
- Показывает последние 5-10 свечей
- Ссылки на каждую свечу
- Статус свечи (активна/погасла)
- Кнопка "Зажечь еще"

#### 4. `/help` - Помощь
**Описание:** Справка по использованию бота

#### 5. `/cancel` - Отмена
**Описание:** Отменяет текущий процесс создания свечи

### Типы свечей (inline keyboard):

```
[🕊️ Спокойствие] [🤝 Поддержка]
[🌙 Память] [✨ Благодарность]
[🎯 Фокус]
```

### Длительность (inline keyboard):

```
[1 час] [24 часа] [7 дней]
```

### Анонимность (inline keyboard):

```
[Публичная] [Анонимная]
```

### Геолокация:

**Вариант 1:** Кнопка "Отправить локацию"
- Пользователь отправляет геолокацию через Telegram
- Бот использует координаты

**Вариант 2:** Текстовый ввод
- Пользователь вводит адрес
- Бот использует геокодирование (через API сайта)

**Вариант 3:** Пропустить
- Свеча создается без геолокации

### Превью свечи:

```
🕯️ Превью свечи:

Тип: 🕊️ Спокойствие
Название: Момент тишины
Сообщение: Время остановиться и просто быть.
Длительность: 1 час
Анонимность: Публичная
Геолокация: Не указана

[✅ Создать] [❌ Отменить]
```

### Успешное создание:

```
✅ Свеча успешно создана!

🕯️ Момент тишины
🕊️ Спокойствие | 1 час

Ссылка: https://candletime.ru/candle/[id]

[🔗 Открыть свечу] [🕯️ Зажечь еще]
```

---

## 🔌 Интеграция с Supabase

### Настройка Supabase клиента:

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Создание свечи:

```typescript
// src/services/candle.ts
import { supabase } from './supabase';

interface CreateCandleData {
  title: string;
  message?: string;
  candle_type: 'calm' | 'support' | 'memory' | 'gratitude' | 'focus';
  duration_hours: 1 | 24 | 168;
  is_anonymous: boolean;
  location?: {
    latitude: number;
    longitude: number;
    country?: string;
    city?: string;
    region?: string;
    address?: string;
  };
  telegram_user_id?: number;
}

export async function createCandle(data: CreateCandleData) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + data.duration_hours);

  const insertData: any = {
    title: data.title.trim(),
    message: data.message?.trim() || null,
    candle_type: data.candle_type,
    duration_hours: data.duration_hours,
    expires_at: expiresAt.toISOString(),
    status: 'active',
    is_anonymous: data.is_anonymous,
    user_id: null, // Анонимные свечи из бота
  };

  // Добавляем геоданные, если они есть
  if (data.location) {
    insertData.location_latitude = data.location.latitude;
    insertData.location_longitude = data.location.longitude;
    insertData.location_country = data.location.country || null;
    insertData.location_city = data.location.city || null;
    insertData.location_region = data.location.region || null;
    insertData.location_address = data.location.address || null;
    insertData.location_show_on_map = true;
    
    // Определяем тип локации
    if (data.location.city && data.location.country) {
      insertData.location_type = 'city';
    } else if (data.location.country) {
      insertData.location_type = 'country';
    } else {
      insertData.location_type = 'precise';
    }
  } else {
    insertData.location_type = 'none';
  }

  const { data: candle, error } = await supabase
    .from('candles')
    .insert(insertData)
    .select('id, title, candle_type')
    .single();

  if (error) {
    throw new Error(`Failed to create candle: ${error.message}`);
  }

  return candle;
}
```

### Получение свечей пользователя:

```typescript
export async function getUserCandles(telegramUserId: number, limit = 10) {
  // Пока что все свечи анонимные, но можно добавить связь через telegram_user_id
  // Для этого нужно добавить поле telegram_user_id в таблицу candles
  
  const { data, error } = await supabase
    .from('candles')
    .select('id, title, candle_type, created_at, expires_at, status')
    .eq('telegram_user_id', telegramUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch candles: ${error.message}`);
  }

  return data;
}
```

### Опционально: Добавить поле telegram_user_id

Если нужно связывать свечи с пользователями Telegram:

```sql
-- Миграция для добавления telegram_user_id
ALTER TABLE candles
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_candles_telegram_user_id 
ON candles(telegram_user_id);
```

---

## 🔒 Безопасность

### 1. Валидация данных

```typescript
// src/services/validation.ts
import { z } from 'zod';

export const CandleSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
  candle_type: z.enum(['calm', 'support', 'memory', 'gratitude', 'focus']),
  duration_hours: z.enum([1, 24, 168]),
  is_anonymous: z.boolean(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});
```

### 2. Rate Limiting

```typescript
// src/utils/rateLimiter.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 час
});

export function checkRateLimit(userId: number, maxRequests = 10, windowMs = 60000) {
  const key = `rate_limit:${userId}`;
  const now = Date.now();
  const requests = rateLimitCache.get(key) || [];
  
  // Удаляем старые запросы
  const recentRequests = requests.filter((time) => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, retryAfter: windowMs - (now - recentRequests[0]) };
  }
  
  recentRequests.push(now);
  rateLimitCache.set(key, recentRequests);
  
  return { allowed: true };
}
```

### 3. Защита от спама

- Ограничение количества свечей в час (например, 10 свечей/час)
- Проверка на дубликаты (одинаковое название и сообщение)
- Валидация всех входных данных

### 4. Переменные окружения

```env
# .env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SITE_URL=https://candletime.ru
NODE_ENV=production
```

**Важно:** Никогда не коммить `.env` файл в Git!

---

## 📋 План реализации

### Этап 1: Подготовка (1-2 дня)

#### 1.1. Создание Telegram бота
1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. Отправить `/newbot`
3. Ввести имя бота (например, "CandleTime Bot")
4. Ввести username бота (например, "candletime_bot")
5. Сохранить токен бота

#### 1.2. Настройка проекта
1. Создать новую директорию `telegram-bot/`
2. Инициализировать npm проект
3. Установить зависимости
4. Настроить TypeScript
5. Создать структуру папок

#### 1.3. Настройка переменных окружения
1. Создать `.env` файл
2. Добавить токен бота
3. Добавить Supabase credentials
4. Добавить SITE_URL

### Этап 2: Базовая функциональность (3-5 дней)

#### 2.1. Настройка бота
- [ ] Инициализация Telegraf
- [ ] Обработка команды `/start`
- [ ] Обработка команды `/help`
- [ ] Обработка команды `/cancel`
- [ ] Базовая структура команд

#### 2.2. Интеграция с Supabase
- [ ] Настройка Supabase клиента
- [ ] Функция создания свечи
- [ ] Валидация данных
- [ ] Обработка ошибок

#### 2.3. Команда `/light` (базовая версия)
- [ ] Выбор типа свечи
- [ ] Ввод названия
- [ ] Ввод сообщения (опционально)
- [ ] Выбор длительности
- [ ] Выбор анонимности
- [ ] Создание свечи
- [ ] Отправка ссылки

### Этап 3: Расширенная функциональность (2-3 дня)

#### 3.1. Геолокация
- [ ] Обработка геолокации из Telegram
- [ ] Геокодирование адресов (опционально)
- [ ] Сохранение координат

#### 3.2. Команда `/my_candles`
- [ ] Получение свечей пользователя
- [ ] Форматирование списка
- [ ] Ссылки на свечи

#### 3.3. Улучшения UX
- [ ] Превью свечи перед созданием
- [ ] Подтверждение создания
- [ ] Улучшенные клавиатуры
- [ ] Обработка ошибок с понятными сообщениями

### Этап 4: Безопасность и оптимизация (2-3 дня)

#### 4.1. Безопасность
- [ ] Rate limiting
- [ ] Валидация всех данных
- [ ] Защита от спама
- [ ] Логирование

#### 4.2. Оптимизация
- [ ] Кэширование (если нужно)
- [ ] Оптимизация запросов к БД
- [ ] Обработка ошибок

#### 4.3. Тестирование
- [ ] Тестирование всех команд
- [ ] Тестирование edge cases
- [ ] Тестирование производительности

### Этап 5: Деплой (1-2 дня)

#### 5.1. Подготовка к деплою
- [ ] Настройка production переменных
- [ ] Оптимизация кода
- [ ] Документация

#### 5.2. Деплой
- [ ] Выбор хостинга
- [ ] Настройка деплоя
- [ ] Настройка webhook (если используется)
- [ ] Тестирование в production

---

## 🚀 Деплой и настройка

### Вариант 1: Railway (рекомендуется)

#### Шаги:
1. Создать аккаунт на [railway.app](https://railway.app)
2. Создать новый проект
3. Подключить GitHub репозиторий
4. Добавить переменные окружения:
   - `TELEGRAM_BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SITE_URL`
5. Railway автоматически задеплоит проект

#### Настройка webhook:
```typescript
// После деплоя установить webhook
const webhookUrl = `https://your-bot.railway.app/webhook`;
await bot.telegram.setWebhook(webhookUrl);
```

### Вариант 2: Render

#### Шаги:
1. Создать аккаунт на [render.com](https://render.com)
2. Создать новый Web Service
3. Подключить GitHub репозиторий
4. Настроить:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Добавить переменные окружения
6. Deploy

### Вариант 3: VPS (DigitalOcean, Hetzner)

#### Шаги:
1. Создать VPS
2. Установить Node.js
3. Клонировать репозиторий
4. Установить зависимости
5. Настроить PM2 для автозапуска
6. Настроить nginx (опционально)
7. Настроить SSL (опционально)

### Настройка webhook (опционально)

Если используешь webhook вместо polling:

```typescript
// src/bot/index.ts
import express from 'express';
import { bot } from './bot';

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});
```

---

## 📝 Пример кода

### Базовая структура бота:

```typescript
// src/bot/index.ts
import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { createCandle } from '../services/candle';
import { handleLightCommand } from './commands/light';
import { handleMyCandlesCommand } from './commands/myCandles';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Команды
bot.command('start', async (ctx) => {
  await ctx.reply(
    `🕯️ Добро пожаловать в CandleTime!\n\n` +
    `Я помогу тебе зажечь символическую свечу прямо из Telegram.\n\n` +
    `Доступные команды:\n` +
    `/light - Зажечь свечу\n` +
    `/my_candles - Мои свечи\n` +
    `/help - Помощь\n\n` +
    `Начни с команды /light`
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `📖 Помощь по использованию бота:\n\n` +
    `/light - Создать новую свечу\n` +
    `/my_candles - Посмотреть мои свечи\n` +
    `/cancel - Отменить текущее действие\n\n` +
    `Для создания свечи используй команду /light`
  );
});

bot.command('light', handleLightCommand);
bot.command('my_candles', handleMyCandlesCommand);
bot.command('cancel', async (ctx) => {
  // Очистка состояния пользователя
  await ctx.reply('❌ Действие отменено');
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Произошла ошибка. Попробуй еще раз.');
});

// Запуск бота
if (process.env.NODE_ENV === 'production') {
  // Webhook mode
  const webhookUrl = process.env.WEBHOOK_URL;
  bot.launch({
    webhook: {
      domain: webhookUrl,
      port: parseInt(process.env.PORT || '3000'),
    },
  });
} else {
  // Polling mode (для разработки)
  bot.launch();
}

console.log('Bot started!');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

### Обработчик команды /light:

```typescript
// src/bot/commands/light.ts
import { Context } from 'telegraf';
import { createCandle } from '../../services/candle';
import { getCandleTypeKeyboard, getDurationKeyboard, getAnonymityKeyboard } from '../keyboards';

interface UserState {
  step: 'type' | 'title' | 'message' | 'duration' | 'anonymous' | 'location' | 'confirm';
  data: {
    type?: string;
    title?: string;
    message?: string;
    duration?: number;
    is_anonymous?: boolean;
    location?: any;
  };
}

const userStates = new Map<number, UserState>();

export async function handleLightCommand(ctx: Context) {
  const userId = ctx.from!.id;
  
  // Инициализация состояния
  userStates.set(userId, {
    step: 'type',
    data: {},
  });

  await ctx.reply(
    '🕯️ Выбери тип свечи:',
    getCandleTypeKeyboard()
  );
}

// Обработка выбора типа
bot.action(/^type:(calm|support|memory|gratitude|focus)$/, async (ctx) => {
  const userId = ctx.from!.id;
  const state = userStates.get(userId);
  
  if (!state || state.step !== 'type') return;
  
  const type = ctx.match[1];
  state.data.type = type;
  state.step = 'title';
  
  await ctx.editMessageText('✍️ Введи название свечи:');
});

// Обработка названия
bot.on(message('text'), async (ctx) => {
  const userId = ctx.from!.id;
  const state = userStates.get(userId);
  
  if (!state) return;
  
  if (state.step === 'title') {
    if (ctx.message.text.length > 100) {
      await ctx.reply('❌ Название не должно превышать 100 символов. Попробуй еще раз:');
      return;
    }
    
    state.data.title = ctx.message.text;
    state.step = 'message';
    
    await ctx.reply(
      '💬 Введи сообщение к свече (или отправь /skip, чтобы пропустить):'
    );
  } else if (state.step === 'message') {
    if (ctx.message.text === '/skip') {
      state.data.message = undefined;
    } else {
      if (ctx.message.text.length > 500) {
        await ctx.reply('❌ Сообщение не должно превышать 500 символов. Попробуй еще раз:');
        return;
      }
      state.data.message = ctx.message.text;
    }
    
    state.step = 'duration';
    
    await ctx.reply(
      '⏰ Выбери длительность:',
      getDurationKeyboard()
    );
  }
});

// И так далее для остальных шагов...
```

---

## 🎯 Итоговый чеклист

### Перед запуском:
- [ ] Создан Telegram бот через BotFather
- [ ] Получен токен бота
- [ ] Настроены переменные окружения
- [ ] Настроен Supabase клиент
- [ ] Реализованы все команды
- [ ] Добавлена валидация данных
- [ ] Добавлен rate limiting
- [ ] Настроено логирование
- [ ] Протестирована функциональность
- [ ] Настроен деплой
- [ ] Настроен webhook (если используется)

### После запуска:
- [ ] Протестированы все команды
- [ ] Проверена интеграция с сайтом
- [ ] Проверена работа геолокации
- [ ] Проверена безопасность
- [ ] Настроен мониторинг (опционально)

---

## 📊 Оценка времени

- **Подготовка:** 1-2 дня
- **Базовая функциональность:** 3-5 дней
- **Расширенная функциональность:** 2-3 дня
- **Безопасность и оптимизация:** 2-3 дня
- **Деплой:** 1-2 дня

**Итого:** 9-15 дней

---

## 🎉 Заключение

Telegram бот для CandleTime позволит пользователям создавать свечи прямо из Telegram, что значительно упростит использование сервиса и увеличит engagement.

Основные преимущества:
- ✅ Удобство использования
- ✅ Быстрое создание свечей
- ✅ Мобильный доступ
- ✅ Интеграция с существующей системой

**Следующие шаги:**
1. Создать Telegram бота через BotFather
2. Настроить проект
3. Реализовать базовую функциональность
4. Протестировать
5. Задеплоить

---

**Последнее обновление:** Январь 2025

