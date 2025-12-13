# 🔒 Руководство по GDPR и приватности для CandleTime

## 📋 Что такое GDPR и почему это важно

**GDPR (General Data Protection Regulation)** — это европейский регламент о защите персональных данных, который применяется ко всем сайтам, которые:
- Обрабатывают персональные данные граждан ЕС
- Используют cookies и аналитику
- Собирают информацию о пользователях

**Важно:** Даже если сайт не находится в ЕС, но посещается пользователями из ЕС, GDPR применяется.

### Что считается персональными данными:
- IP-адреса
- Email адреса
- Имена пользователей
- Данные аналитики (Google Analytics, Yandex.Metrica)
- Cookies
- Любая информация, которая может идентифицировать человека

---

## ✅ Что нужно сделать для CandleTime

### 1. Политика конфиденциальности
### 2. Уведомление о cookies и согласие
### 3. Обработка данных пользователей
### 4. Права пользователей (доступ, удаление данных)
### 5. Безопасность данных

---

## 1. 📄 Политика конфиденциальности

### Создай страницу `/privacy` или `/privacy-policy`

**Что должно быть включено:**

1. **Какие данные собираются:**
   - Email (при регистрации)
   - IP-адреса (через аналитику)
   - Данные о посещениях (Google Analytics, Yandex.Metrica)
   - Cookies
   - Данные свечей (название, сообщение, тип)

2. **Как используются данные:**
   - Для работы сервиса
   - Для аналитики и улучшения сайта
   - Для связи с пользователями (если нужно)

3. **С кем делятся данные:**
   - Google Analytics (для аналитики)
   - Yandex.Metrica (для аналитики)
   - Supabase (для хранения данных)
   - Vercel (для хостинга)

4. **Права пользователей:**
   - Право на доступ к данным
   - Право на удаление данных
   - Право на исправление данных
   - Право на отзыв согласия

5. **Контакты:**
   - Email для запросов о данных
   - Способы связи

---

## 2. 🍪 Уведомление о cookies и согласие

### Создай компонент для уведомления о cookies

**Требования:**
- Показывать уведомление при первом посещении
- Запрашивать согласие перед загрузкой аналитики
- Сохранять выбор пользователя
- Позволять изменить настройки

### Реализация:

#### Шаг 1: Создай компонент `components/CookieConsent.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)

  useEffect(() => {
    // Проверяем, дал ли пользователь согласие ранее
    const consent = localStorage.getItem('cookie-consent')
    if (consent === null) {
      // Показываем баннер только если согласие не было дано
      setShowBanner(true)
    } else {
      setConsentGiven(consent === 'true')
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setConsentGiven(true)
    setShowBanner(false)
    // Включаем аналитику только после согласия
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cookie-consent-given'))
    }
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'false')
    setConsentGiven(false)
    setShowBanner(false)
    // Не загружаем аналитику
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-2xl">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
              Мы используем cookies и аналитику для улучшения сайта. 
              Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
              <a
                href="/privacy"
                className="underline hover:text-slate-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Политикой конфиденциальности
              </a>
              .
            </p>
          </div>
          <div className="flex gap-3 sm:flex-shrink-0">
            <button
              onClick={handleReject}
              className="rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              Отклонить
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              Принять
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### Шаг 2: Обнови `app/layout.tsx` для условной загрузки аналитики

```tsx
'use client' // Если нужно использовать useState/useEffect

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { CookieConsent } from '@/components/CookieConsent'

// ... остальной код ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Проверяем согласие при загрузке
    const consent = localStorage.getItem('cookie-consent')
    if (consent === 'true') {
      setAnalyticsEnabled(true)
    }

    // Слушаем событие согласия
    const handleConsent = () => {
      setAnalyticsEnabled(true)
    }
    window.addEventListener('cookie-consent-given', handleConsent)

    return () => {
      window.removeEventListener('cookie-consent-given', handleConsent)
    }
  }, [])

  return (
    <html lang="ru">
      <head>
        {/* ... остальные теги ... */}
      </head>
      <body>
        {/* Google Analytics - загружаем только с согласием */}
        {analyticsEnabled && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-M4TVTP953T"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-M4TVTP953T', {
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}

        {/* ... остальной контент ... */}
        <CookieConsent />
      </body>
    </html>
  )
}
```

**Проблема:** В Next.js App Router `layout.tsx` по умолчанию Server Component. Нужно создать отдельный компонент для аналитики.

#### Шаг 3: Создай `components/Analytics.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Проверяем согласие
    const consent = localStorage.getItem('cookie-consent')
    if (consent === 'true') {
      setEnabled(true)
    }

    // Слушаем событие согласия
    const handleConsent = () => {
      setEnabled(true)
    }
    window.addEventListener('cookie-consent-given', handleConsent)

    return () => {
      window.removeEventListener('cookie-consent-given', handleConsent)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-M4TVTP953T"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-M4TVTP953T', {
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  )
}
```

#### Шаг 4: Обнови `app/layout.tsx` (Server Component)

```tsx
import { Analytics } from '@/components/Analytics'
import { CookieConsent } from '@/components/CookieConsent'

// ... остальной код ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* ... */}
      </head>
      <body>
        <Analytics />
        {/* ... остальной контент ... */}
        <CookieConsent />
      </body>
    </html>
  )
}
```

---

## 3. 🔐 Обработка данных пользователей

### Настройки Supabase

#### Шаг 1: Включи анонимизацию IP в Supabase

В настройках Supabase (если используешь аналитику):
- Включи опцию анонимизации IP-адресов

#### Шаг 2: Настрой RLS (Row Level Security)

Убедись, что RLS политики настроены правильно:
- Пользователи видят только свои данные
- Публичные свечи доступны всем
- Приватные свечи доступны только владельцу

---

## 4. 👤 Права пользователей

### Создай страницу `/account/data` или `/settings/privacy`

**Функционал:**

1. **Просмотр данных:**
   - Показать все данные пользователя
   - Список свечей
   - История активности

2. **Экспорт данных:**
   - Кнопка "Экспортировать мои данные"
   - Формат: JSON или CSV

3. **Удаление данных:**
   - Кнопка "Удалить аккаунт"
   - Подтверждение
   - Удаление всех данных пользователя

### Пример реализации:

#### `app/account/data/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DataManagementPage() {
  const [loading, setLoading] = useState(false)

  const handleExportData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Получаем все данные пользователя
      const { data: candles } = await supabase
        .from('candles')
        .select('*')
        .eq('user_id', user.id)

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        candles: candles || [],
        exported_at: new Date().toISOString(),
      }

      // Создаем JSON файл для скачивания
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `candletime-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Ошибка при экспорте данных')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Вы уверены? Это действие нельзя отменить. Все ваши данные будут удалены.')) {
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Удаляем все свечи пользователя
      await supabase
        .from('candles')
        .delete()
        .eq('user_id', user.id)

      // Удаляем аккаунт
      await supabase.auth.admin.deleteUser(user.id)

      // Перенаправляем на главную
      window.location.href = '/'
    } catch (error) {
      console.error('Delete error:', error)
      alert('Ошибка при удалении аккаунта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Управление данными</h1>

      <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold">Экспорт данных</h2>
        <p className="mb-4 text-sm text-slate-600">
          Вы можете скачать все ваши данные в формате JSON.
        </p>
        <button
          onClick={handleExportData}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Экспорт...' : 'Экспортировать данные'}
        </button>
      </div>

      <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-red-900">Удаление аккаунта</h2>
        <p className="mb-4 text-sm text-red-700">
          Удаление аккаунта приведет к безвозвратному удалению всех ваших данных, включая все свечи.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Удаление...' : 'Удалить аккаунт'}
        </button>
      </div>
    </div>
  )
}
```

---

## 5. 📧 Контакты для запросов о данных

### Создай страницу `/contact` или `/privacy/request`

**Что должно быть:**
- Форма для запросов о данных
- Email для связи: `privacy@candletime.ru` (или другой)
- Информация о сроках ответа (обычно 30 дней)

---

## 6. 🔒 Безопасность данных

### Рекомендации:

1. **HTTPS:** Убедись, что сайт работает только по HTTPS (Vercel делает это автоматически)

2. **Анонимизация IP:**
   - В Google Analytics: `anonymize_ip: true`
   - В Yandex.Metrica: включи в настройках

3. **Хранение паролей:**
   - Supabase использует безопасное хранение (bcrypt)
   - Не храни пароли в открытом виде

4. **Ограничение доступа:**
   - RLS политики в Supabase
   - Проверка прав доступа на сервере

---

## 7. 📋 Чек-лист соответствия GDPR

### Обязательные элементы:

- [ ] **Политика конфиденциальности** (`/privacy`)
  - Описание собираемых данных
  - Цели использования
  - Права пользователей
  - Контакты

- [ ] **Уведомление о cookies**
  - Баннер при первом посещении
  - Запрос согласия
  - Возможность отклонить
  - Сохранение выбора

- [ ] **Условная загрузка аналитики**
  - Аналитика загружается только с согласием
  - Анонимизация IP

- [ ] **Управление данными**
  - Экспорт данных пользователя
  - Удаление аккаунта
  - Просмотр данных

- [ ] **Контакты**
  - Email для запросов о данных
  - Форма для обращений

- [ ] **Безопасность**
  - HTTPS
  - Анонимизация IP
  - RLS политики

---

## 8. 🎨 Улучшенный компонент CookieConsent

### Версия с настройками cookies:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CookiePreferences = {
  necessary: boolean // Всегда true
  analytics: boolean
  functional: boolean
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem('cookie-preferences')
    if (saved) {
      const parsed = JSON.parse(saved)
      setPreferences(parsed)
    } else {
      setShowBanner(true)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences))
    setShowBanner(false)
    setShowSettings(false)
    
    if (preferences.analytics) {
      window.dispatchEvent(new Event('cookie-consent-given'))
    }
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
    }
    setPreferences(allAccepted)
    handleSave()
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      functional: false,
    }
    setPreferences(onlyNecessary)
    handleSave()
  }

  if (!showBanner) {
    // Кнопка для изменения настроек
    return (
      <button
        onClick={() => setShowBanner(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-slate-900 px-4 py-2 text-xs text-white shadow-lg hover:bg-slate-800"
      >
        Настройки cookies
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white shadow-2xl">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        {!showSettings ? (
          // Баннер
          <>
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold">Мы используем cookies</h3>
              <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
                Мы используем cookies для улучшения работы сайта и аналитики. 
                Подробнее в{' '}
                <Link href="/privacy" className="underline hover:text-slate-200">
                  Политике конфиденциальности
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRejectAll}
                className="rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Отклонить все
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Настроить
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
              >
                Принять все
              </button>
            </div>
          </>
        ) : (
          // Настройки
          <>
            <div className="mb-4">
              <h3 className="mb-4 text-lg font-semibold">Настройки cookies</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Необходимые</p>
                    <p className="text-xs text-slate-300">
                      Обязательные для работы сайта
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Аналитика</p>
                    <p className="text-xs text-slate-300">
                      Google Analytics, Yandex.Metrica
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Функциональные</p>
                    <p className="text-xs text-slate-300">
                      Для улучшения функционала
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({ ...preferences, functional: e.target.checked })
                    }
                    className="h-5 w-5"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
              >
                Сохранить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## 9. 📝 Пример Политики конфиденциальности

### Создай `app/privacy/page.tsx`

```tsx
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold">Политика конфиденциальности</h1>
      
      <section>
        <h2 className="mb-4 text-xl font-semibold">1. Какие данные мы собираем</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Email адрес (при регистрации)</li>
          <li>Данные о свечах (название, сообщение, тип)</li>
          <li>IP-адреса (анонимизированные)</li>
          <li>Данные о посещениях (через аналитику)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">2. Как мы используем данные</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Для работы сервиса</li>
          <li>Для аналитики и улучшения сайта</li>
          <li>Для связи с пользователями (при необходимости)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">3. С кем мы делимся данными</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Google Analytics (аналитика)</li>
          <li>Yandex.Metrica (аналитика)</li>
          <li>Supabase (хранение данных)</li>
          <li>Vercel (хостинг)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">4. Ваши права</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Право на доступ к вашим данным</li>
          <li>Право на удаление данных</li>
          <li>Право на исправление данных</li>
          <li>Право на отзыв согласия</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">5. Контакты</h2>
        <p>
          По вопросам о данных обращайтесь: <a href="mailto:privacy@candletime.ru" className="underline">privacy@candletime.ru</a>
        </p>
      </section>

      <p className="text-sm text-slate-600">
        Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
      </p>
    </div>
  )
}
```

---

## 10. ⚠️ Важные замечания

### Юридические аспекты:

1. **Консультация с юристом:** Для полного соответствия GDPR рекомендуется проконсультироваться с юристом

2. **Регулярное обновление:** Политика конфиденциальности должна обновляться при изменениях

3. **Уведомления:** При значительных изменениях уведомляй пользователей

4. **Хранение согласий:** Сохраняй записи о согласиях пользователей

### Технические аспекты:

1. **Производительность:** Уведомление о cookies не должно замедлять сайт

2. **UX:** Сделай процесс согласия простым и понятным

3. **Тестирование:** Протестируй на разных устройствах и браузерах

---

*Документ создан: 2025*  
*Версия: 1.0*  
*Проект: CandleTime (candletime.ru)*

