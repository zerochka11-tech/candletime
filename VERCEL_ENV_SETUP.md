# 🔧 Настройка переменных окружения в Vercel

## Проблема
Ошибка при деплое: `Error: supabaseUrl is required`

Это означает, что переменные окружения не установлены в Vercel.

## Решение

### Шаг 1: Получи ключи Supabase

1. Зайди в свой проект Supabase
2. Перейди в **Settings** → **API**
3. Скопируй:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** key (длинная строка, начинается с `eyJ...`)

### Шаг 2: Добавь переменные в Vercel

1. Зайди в проект на [vercel.com](https://vercel.com)
2. Перейди в **Settings** → **Environment Variables**
3. Добавь две переменные:

   **Переменная 1:**
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** твой Supabase Project URL (например: `https://xxxxx.supabase.co`)
   - **Environment:** выбери все (Production, Preview, Development)

   **Переменная 2:**
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** твой Supabase anon public key
   - **Environment:** выбери все (Production, Preview, Development)

   **Переменная 3 (для админ-панели):**
   - **Key:** `NEXT_PUBLIC_ADMIN_EMAILS`
   - **Value:** твой email администратора (например: `admin@example.com`)
   - **Environment:** выбери все (Production, Preview, Development)

   **Переменная 4 (для API админ-панели):**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** твой Supabase service_role key (⚠️ НЕ anon key!)
   - **Environment:** выбери все (Production, Preview, Development)

   **Переменная 5 (для генерации статей через Gemini API):**
   - **Key:** `GEMINI_API_KEY`
   - **Value:** твой Gemini API ключ (получить в [Google AI Studio](https://aistudio.google.com/app/apikey))
   - **Environment:** выбери все (Production, Preview, Development)
   - **⚠️ Важно:** Эта переменная нужна только если используешь функцию генерации статей

4. Нажми **Save** для каждой переменной

### Шаг 3: Перезапусти деплой

1. Перейди в **Deployments**
2. Найди последний деплой
3. Нажми на **"..."** (три точки) → **Redeploy**
4. Или сделай новый коммит и push в GitHub

### Шаг 4: Проверка

После перезапуска деплоя:
- Сборка должна пройти успешно
- Сайт должен работать
- Проверь логи в Vercel, если что-то не так

---

## ⚠️ Важно

- **NEXT_PUBLIC_** префикс обязателен для переменных, которые используются в клиентском коде
- Переменные должны быть добавлены для всех окружений (Production, Preview, Development)
- После добавления переменных нужно перезапустить деплой

---

## 🔍 Проверка переменных

Чтобы убедиться, что переменные установлены:

1. В Vercel: **Settings** → **Environment Variables**
2. Должны быть видны:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `NEXT_PUBLIC_ADMIN_EMAILS` (для админ-панели)
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` (для API админ-панели)
   - ✅ `GEMINI_API_KEY` (для генерации статей, опционально)

---

## 📝 Пример значений

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Важно:** Используй свои реальные значения из Supabase!

