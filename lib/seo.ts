import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';
const siteName = 'CandleTime';
const defaultDescription =
  'Тихое место, чтобы зажечь символическую свечу онлайн. Без ленты и лайков — только спокойный жест внимания.';

/**
 * Генерирует базовые мета-теги для страницы
 */
export function generateMetadata({
  title,
  description = defaultDescription,
  image,
  path = '',
  type = 'website',
}: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article';
}): Metadata {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const url = `${siteUrl}${path}`;
  // Используем динамическую генерацию OG изображений
  // Для страниц свечей используется DynamicMeta компонент, который устанавливает правильное изображение
  const ogImage = image || `${siteUrl}/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description || defaultDescription)}`;

  return {
    title: fullTitle,
    description,
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
 * Генерирует структурированные данные (JSON-LD) для главной страницы
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
 * Генерирует структурированные данные для страницы свечи
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
 * Генерирует структурированные данные для организации
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
 * Генерирует структурированные данные BreadcrumbList для навигации
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
 * Генерирует структурированные данные ItemList для страницы со списком свечей
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

