# 🚀 План оптимизации производительности на основе анализа HAR

**Дата:** 2025-12-12  
**Проект:** CandleTime (candletime.ru)  
**Проблема:** Блокировка запроса на 10+ секунд перед загрузкой страницы

---

## 📊 Анализ проблемы

### Текущая ситуация (из HAR файла):
- **Время блокировки:** 10,015 мс (10+ секунд!)
- **Общее время загрузки:** 10,272 мс
- **onContentLoad:** 10,337 мс
- **onLoad:** 10,491 мс

### Текущая архитектура проекта:
- ✅ Next.js App Router с i18n (next-intl)
- ✅ Analytics и YandexMetrika загружаются синхронно в layout.tsx
- ✅ CookieConsent загружается синхронно
- ⚠️ Минималистичный next.config.ts без оптимизаций
- ⚠️ Нет Resource Hints (preconnect, dns-prefetch, preload)
- ⚠️ Нет динамической загрузки не-критических компонентов

---

## ✅ РЕШЕНИЯ (с учетом текущей архитектуры)

### 1. Добавление Resource Hints (КРИТИЧНО) 🔴

**Проблема:** Браузер не знает, какие ресурсы критичны, и блокирует запросы.

**Решение:** Добавить Resource Hints в `app/layout.tsx` и `app/[locale]/layout.tsx`

#### Изменения в `app/layout.tsx`:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        
        {/* Resource Hints для оптимизации загрузки */}
        <link rel="preconnect" href="https://candletime.ru" />
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        
        {/* Preload критических ресурсов */}
        <link 
          rel="preload" 
          href="/_next/static/chunks/main-app.js" 
          as="script" 
        />
        
        {/* Мета-теги */}
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <meta name="yandex-verification" content="c1fb551ad90d3556" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Analytics />
        <YandexMetrika />
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
```

#### Изменения в `app/[locale]/layout.tsx`:

```tsx
// app/[locale]/layout.tsx
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // ... существующий код ...

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        
        {/* Resource Hints */}
        <link rel="preconnect" href="https://candletime.ru" />
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        
        {/* Мета-теги */}
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <link rel="alternate" hrefLang="ru" href="https://candletime.ru" />
        <link rel="alternate" hrefLang="en" href="https://candletime.ru/en" />
        <link rel="alternate" hrefLang="x-default" href="https://candletime.ru" />
      </head>
      {/* ... остальной код ... */}
    </html>
  );
}
```

---

### 2. Оптимизация next.config.ts 🔴

**Проблема:** Конфигурация Next.js не оптимизирована для производительности.

**Решение:** Обновить `next.config.ts`:

```typescript
// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Включить сжатие
  compress: true,
  
  // Оптимизация изображений (если используются)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Оптимизация заголовков
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // Экспериментальные оптимизации
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'next-intl',
    ],
  },
  
  // Оптимизация сборки
  swcMinify: true,
  
  // Оптимизация production сборки
  productionBrowserSourceMaps: false,
};

export default withNextIntl(nextConfig);
```

---

### 3. Динамическая загрузка не-критических компонентов 🟡

**Проблема:** Analytics, YandexMetrika и CookieConsent загружаются синхронно, блокируя рендеринг.

**Решение:** Использовать `next/dynamic` для ленивой загрузки.

#### Обновить `app/layout.tsx`:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ThemeScript } from '@/components/ThemeScript';
import { generateMetadata as generateBaseMetadata, generateOrganizationStructuredData } from '@/lib/seo';
import dynamic from 'next/dynamic';

// Ленивая загрузка не-критических компонентов
const Analytics = dynamic(() => import('@/components/Analytics').then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

const YandexMetrika = dynamic(() => import('@/components/YandexMetrika').then(mod => ({ default: mod.YandexMetrika })), {
  ssr: false,
});

const CookieConsent = dynamic(() => import('@/components/CookieConsent').then(mod => ({ default: mod.CookieConsent })), {
  ssr: false,
});

// ... остальной код metadata ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Resource Hints */}
        <link rel="preconnect" href="https://candletime.ru" />
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <meta name="yandex-verification" content="c1fb551ad90d3556" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <SiteHeader />
        <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
          {children}
        </main>
        <SiteFooter />
        
        {/* Не-критические компоненты загружаются после основного контента */}
        <Analytics />
        <YandexMetrika />
        <CookieConsent />
      </body>
    </html>
  );
}
```

#### Обновить `app/[locale]/layout.tsx` аналогично:

```tsx
// app/[locale]/layout.tsx
import dynamic from 'next/dynamic';

const Analytics = dynamic(() => import('@/components/Analytics').then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

const CookieConsent = dynamic(() => import('@/components/CookieConsent').then(mod => ({ default: mod.CookieConsent })), {
  ssr: false,
});

// ... остальной код ...
```

---

### 4. Оптимизация компонентов Analytics и YandexMetrika 🟡

**Проблема:** Компоненты проверяют localStorage при каждом рендере, что может замедлять загрузку.

**Решение:** Оптимизировать проверку согласия.

#### Обновить `components/Analytics.tsx`:

```tsx
// components/Analytics.tsx
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function Analytics() {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Проверяем согласие только после монтирования
    const checkConsent = () => {
      try {
        const saved = localStorage.getItem('cookie-preferences')
        if (saved) {
          const preferences = JSON.parse(saved)
          if (preferences.analytics) {
            setEnabled(true)
          }
        }
      } catch {
        // Если ошибка парсинга, не включаем аналитику
      }
    }

    checkConsent()

    // Слушаем событие согласия
    const handleConsent = () => {
      setEnabled(true)
    }
    window.addEventListener('cookie-consent-given', handleConsent)

    return () => {
      window.removeEventListener('cookie-consent-given', handleConsent)
    }
  }, [])

  // Не рендерим ничего до монтирования (избегаем hydration mismatch)
  if (!mounted || !enabled) return null

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-M4TVTP953T"
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
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

#### Обновить `components/YandexMetrika.tsx` аналогично:

```tsx
// components/YandexMetrika.tsx
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '105780499'

export function YandexMetrika() {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkConsent = () => {
      try {
        const saved = localStorage.getItem('cookie-preferences')
        if (saved) {
          const preferences = JSON.parse(saved)
          if (preferences.analytics) {
            setEnabled(true)
          }
        }
      } catch {
        // Если ошибка парсинга, не включаем аналитику
      }
    }

    checkConsent()

    const handleConsent = () => {
      setEnabled(true)
    }
    window.addEventListener('cookie-consent-given', handleConsent)

    return () => {
      window.removeEventListener('cookie-consent-given', handleConsent)
    }
  }, [])

  if (!mounted || !enabled || !YANDEX_METRIKA_ID) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="lazyOnload">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

          ym(${YANDEX_METRIKA_ID}, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
```

**Изменения:**
- Добавлен `mounted` state для избежания hydration mismatch
- Изменен `strategy` с `afterInteractive` на `lazyOnload` для еще более поздней загрузки
- Улучшена обработка ошибок

---

### 5. Оптимизация критического CSS 🟡

**Проблема:** CSS блокирует рендеринг.

**Решение:** Добавить inline критический CSS для above-the-fold контента.

#### Создать `app/critical.css`:

```css
/* Критические стили для above-the-fold контента */
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Минимальные стили для header */
header {
  position: sticky;
  top: 0;
  z-index: 30;
}
```

#### Добавить в `app/layout.tsx`:

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import './critical.css'; // Добавить импорт

// ... остальной код ...
```

---

### 6. Оптимизация API routes (если используются) 🟢

**Проблема:** Медленные API запросы могут блокировать рендеринг.

**Решение:** Настроить правильные заголовки кэширования.

#### Пример для API routes:

```typescript
// app/api/candles/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // ... получение данных ...
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
    },
  });
}
```

---

## 📋 Чеклист внедрения

### Немедленные действия (высокий приоритет):

- [x] **Добавить Resource Hints** в `app/layout.tsx` и `app/[locale]/layout.tsx` ✅
  - [x] preconnect для candletime.ru
  - [x] preconnect для vercel.com
  - [x] dns-prefetch для googletagmanager.com
  - [x] dns-prefetch для mc.yandex.ru

- [x] **Оптимизировать next.config.ts** ✅
  - [x] Включить compress
  - [x] Добавить headers для DNS prefetch и безопасности
  - [x] Включить экспериментальные оптимизации
  - [x] Настроить оптимизацию изображений
  - [x] Включить swcMinify

- [ ] **Использовать dynamic import** для Analytics, YandexMetrika, CookieConsent
  - [ ] Обновить `app/layout.tsx`
  - [ ] Обновить `app/[locale]/layout.tsx`

### Средний приоритет:

- [ ] **Оптимизировать компоненты Analytics и YandexMetrika**
  - [ ] Добавить mounted state
  - [ ] Изменить strategy на lazyOnload

- [ ] **Добавить критический CSS**
  - [ ] Создать `app/critical.css`
  - [ ] Добавить inline стили для header

- [ ] **Оптимизировать API routes** (если используются)
  - [ ] Добавить заголовки кэширования

### Долгосрочные улучшения:

- [ ] Внедрить React Query или SWR для кэширования
- [ ] Оптимизировать bundle size (анализ через `@next/bundle-analyzer`)
- [ ] Добавить мониторинг производительности (Web Vitals)
- [ ] Оптимизировать изображения (если будут добавлены)

---

## 🎯 Ожидаемые результаты

После внедрения решений:

- **Время блокировки:** с 10,015 мс → до < 100 мс (улучшение на 99%)
- **onContentLoad:** с 10,337 мс → до < 2,000 мс (улучшение на 80%)
- **onLoad:** с 10,491 мс → до < 3,000 мс (улучшение на 71%)
- **LCP (Largest Contentful Paint):** < 2.5 с
- **FID (First Input Delay):** < 100 мс
- **CLS (Cumulative Layout Shift):** < 0.1

---

## 🔧 Тестирование

### После внедрения проверить:

1. **Chrome DevTools Performance:**
   - Открыть DevTools → Performance
   - Записать загрузку страницы
   - Проверить время блокировки

2. **Lighthouse:**
   - Запустить Lighthouse в Chrome DevTools
   - Проверить метрики производительности
   - Убедиться, что Performance score > 90

3. **WebPageTest:**
   - Протестировать на [webpagetest.org](https://www.webpagetest.org)
   - Проверить метрики на разных устройствах

4. **Real User Monitoring:**
   - Отслеживать Web Vitals в Google Analytics
   - Мониторить производительность в реальных условиях

---

## 📝 Примечания

- Все изменения обратно совместимы с текущей архитектурой
- Не требуют изменений в базе данных или API
- Можно внедрять поэтапно
- Рекомендуется тестировать на staging перед production

---

**Автор:** AI Assistant  
**Дата:** 2025-12-12  
**Версия:** 1.0

