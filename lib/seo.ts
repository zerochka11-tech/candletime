import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';
const siteName = 'CandleTime';
const defaultDescription =
  'Тихое место, чтобы зажечь символическую свечу онлайн. Без ленты и лайков — только спокойный жест внимания.';

/**
 * Генерирует полный набор мета-тегов для страницы (Open Graph, Twitter, SEO)
 * 
 * @param params - Параметры мета-тегов
 * @param params.title - Заголовок страницы
 * @param params.description - Описание страницы (по умолчанию используется базовое описание)
 * @param params.image - URL изображения для OG (по умолчанию генерируется динамически)
 * @param params.path - Путь страницы для canonical URL
 * @param params.type - Тип контента: 'website' или 'article'
 * @param params.keywords - Массив ключевых слов для SEO
 * @returns Объект Metadata для Next.js
 * 
 * @example
 * ```typescript
 * export const metadata = generateMetadata({
 *   title: 'Моя страница',
 *   description: 'Описание страницы',
 *   path: '/my-page',
 *   keywords: ['ключевое', 'слово']
 * });
 * ```
 */
export function generateMetadata({
  title,
  description = defaultDescription,
  image,
  path = '',
  type = 'website',
  keywords,
}: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}): Metadata {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const url = `${siteUrl}${path}`;
  // Используем динамическую генерацию OG изображений
  // Для страниц свечей используется DynamicMeta компонент, который устанавливает правильное изображение
  const ogImage = image || `${siteUrl}/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description || defaultDescription)}`;

  // Базовые ключевые слова, если не указаны
  const defaultKeywords = ['CandleTime', 'символические свечи', 'онлайн свечи', 'виртуальные свечи'];
  const finalKeywords = keywords ? [...defaultKeywords, ...keywords] : defaultKeywords;

  return {
    title: fullTitle,
    description,
    keywords: finalKeywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      title: fullTitle,
      description,
      url,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Генерирует структурированные данные Schema.org для главной страницы (WebSite)
 * 
 * @returns JSON-LD объект для вставки в <script type="application/ld+json">
 * 
 * @example
 * ```typescript
 * const data = generateHomePageStructuredData();
 * <script type="application/ld+json">
 *   {JSON.stringify(data)}
 * </script>
 * ```
 */
export function generateHomePageStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    inLanguage: 'ru',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/candles?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Генерирует структурированные данные Schema.org для страницы свечи (CreativeWork)
 * 
 * @param params - Параметры свечи
 * @param params.title - Название свечи
 * @param params.description - Описание свечи (опционально)
 * @param params.createdAt - Дата создания в ISO формате
 * @param params.expiresAt - Дата истечения в ISO формате
 * @param params.url - Полный URL страницы свечи
 * @returns JSON-LD объект типа CreativeWork
 * 
 * @example
 * ```typescript
 * const data = generateCandleStructuredData({
 *   title: 'Моя свеча',
 *   createdAt: '2025-01-15T10:00:00Z',
 *   expiresAt: '2025-01-16T10:00:00Z',
 *   url: 'https://candletime.ru/candle/123'
 * });
 * ```
 */
export function generateCandleStructuredData({
  title,
  description,
  createdAt,
  expiresAt,
  url,
}: {
  title: string;
  description?: string;
  createdAt: string;
  expiresAt: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: description || title,
    dateCreated: createdAt,
    dateModified: expiresAt,
    url,
    inLanguage: 'ru',
  };
}

/**
 * Генерирует структурированные данные Schema.org для организации (Organization)
 * 
 * @returns JSON-LD объект типа Organization с информацией о CandleTime
 * 
 * @example
 * ```typescript
 * const data = generateOrganizationStructuredData();
 * ```
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    logo: `${siteUrl}/favicon.svg`,
  };
}

/**
 * Генерирует структурированные данные Schema.org для хлебных крошек (BreadcrumbList)
 * 
 * @param items - Массив элементов навигации с именем и URL
 * @returns JSON-LD объект типа BreadcrumbList
 * 
 * @example
 * ```typescript
 * const breadcrumbs = generateBreadcrumbList([
 *   { name: 'Главная', url: 'https://candletime.ru' },
 *   { name: 'Свечи', url: 'https://candletime.ru/candles' }
 * ]);
 * ```
 */
export function generateBreadcrumbList(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Генерирует структурированные данные Schema.org для списка свечей (ItemList)
 * 
 * @param candles - Массив свечей с id и title
 * @returns JSON-LD объект типа ItemList
 * 
 * @example
 * ```typescript
 * const list = generateCandlesItemList([
 *   { id: '123', title: 'Свеча 1' },
 *   { id: '456', title: 'Свеча 2' }
 * ]);
 * ```
 */
export function generateCandlesItemList(candles: Array<{ id: string; title: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Активные символические свечи',
    description: 'Список всех активных символических свечей на CandleTime',
    numberOfItems: candles.length,
    itemListElement: candles.map((candle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        '@id': `${siteUrl}/candle/${candle.id}`,
        name: candle.title,
        url: `${siteUrl}/candle/${candle.id}`,
      },
    })),
  };
}

/**
 * Генерирует структурированные данные Schema.org для статьи (Article)
 * 
 * @param params - Параметры статьи
 * @param params.title - Заголовок статьи
 * @param params.description - Описание статьи
 * @param params.content - Полный текст статьи
 * @param params.publishedAt - Дата публикации в ISO формате
 * @param params.modifiedAt - Дата последнего изменения в ISO формате
 * @param params.url - URL статьи
 * @param params.author - Информация об авторе
 * @param params.image - URL изображения статьи (опционально)
 * @returns JSON-LD объект типа Article
 * 
 * @example
 * ```typescript
 * const article = generateArticleStructuredData({
 *   title: 'Как зажечь свечу',
 *   description: 'Инструкция...',
 *   content: 'Полный текст...',
 *   publishedAt: '2025-01-15T10:00:00Z',
 *   modifiedAt: '2025-01-15T10:00:00Z',
 *   url: 'https://candletime.ru/faq/kak-zazhech',
 *   author: { name: 'CandleTime' }
 * });
 * ```
 */
export function generateArticleStructuredData({
  title,
  description,
  content,
  publishedAt,
  modifiedAt,
  url,
  author,
  image,
}: {
  title: string;
  description?: string;
  content: string;
  publishedAt: string;
  modifiedAt: string;
  url: string;
  author: {
    name: string;
    url?: string;
  };
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || title,
    articleBody: content,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/favicon.svg`,
      },
    },
    url,
    inLanguage: 'ru',
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
  };
}

/**
 * Генерирует структурированные данные Schema.org для страницы FAQ (FAQPage)
 * 
 * @param faqItems - Массив вопросов и ответов
 * @returns JSON-LD объект типа FAQPage
 * 
 * @example
 * ```typescript
 * const faq = generateFAQPageStructuredData([
 *   { question: 'Что такое CandleTime?', answer: 'Это сервис...' },
 *   { question: 'Как зажечь свечу?', answer: 'Перейдите на страницу...' }
 * ]);
 * ```
 */
export function generateFAQPageStructuredData(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Генерирует структурированные данные Schema.org для инструкции (HowTo)
 * 
 * @param params - Параметры инструкции
 * @param params.name - Название инструкции
 * @param params.description - Описание инструкции
 * @param params.steps - Массив шагов инструкции
 * @param params.url - URL страницы с инструкцией
 * @returns JSON-LD объект типа HowTo
 * 
 * @example
 * ```typescript
 * const howTo = generateHowToStructuredData({
 *   name: 'Как зажечь свечу',
 *   description: 'Пошаговая инструкция',
 *   steps: [
 *     { name: 'Шаг 1', text: 'Выберите тип свечи' },
 *     { name: 'Шаг 2', text: 'Введите название' }
 *   ],
 *   url: 'https://candletime.ru/light'
 * });
 * ```
 */
export function generateHowToStructuredData({
  name,
  description,
  steps,
  url,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
    url,
  };
}

/**
 * Генерирует структурированные данные Schema.org для страницы карты (WebPage с ItemList)
 * 
 * @param params - Параметры карты
 * @param params.name - Название страницы карты
 * @param params.description - Описание карты
 * @param params.url - URL страницы карты
 * @param params.numberOfItems - Количество свечей на карте (опционально)
 * @returns JSON-LD объект типа WebPage с вложенным ItemList
 * 
 * @example
 * ```typescript
 * const map = generateMapStructuredData({
 *   name: 'Карта свечей',
 *   description: 'Интерактивная карта...',
 *   url: 'https://candletime.ru/map',
 *   numberOfItems: 150
 * });
 * ```
 */
export function generateMapStructuredData({
  name,
  description,
  url,
  numberOfItems,
}: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    inLanguage: 'ru',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Свечи на карте',
      description: 'Интерактивная карта с расположением символических свечей',
      ...(numberOfItems !== undefined && { numberOfItems }),
    },
  };
}

