'use client';

import { useEffect } from 'react';
import { generateCandleStructuredData } from '@/lib/seo';
import { CandleBreadcrumbList } from './StructuredDataList';

type Candle = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  is_anonymous: boolean;
};

/**
 * Компонент для динамического обновления мета-тегов на клиентской странице
 */
export function DynamicMeta({ candle }: { candle: Candle | null }) {
  useEffect(() => {
    if (!candle) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';
    const url = `${siteUrl}/candle/${candle.id}`;
    const title = candle.is_anonymous ? 'Анонимная свеча' : candle.title;
    const description = candle.message || title;

    // Обновляем title
    document.title = `${title} | CandleTime`;

    // Обновляем или создаем мета-теги
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Базовые мета-теги
    updateMetaTag('description', description);
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', 'article', 'property');
    
    // Динамическое OG изображение для свечи
    const ogImageUrl = `${siteUrl}/og/candle?id=${candle.id}`;
    updateMetaTag('og:image', ogImageUrl, 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:image:alt', title, 'property');
    
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:image', ogImageUrl);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Структурированные данные
    const structuredData = generateCandleStructuredData({
      title,
      description,
      createdAt: candle.created_at,
      expiresAt: candle.expires_at,
      url,
    });

    let script = document.querySelector('script[type="application/ld+json"][data-candle]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-candle', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [candle]);

  if (!candle) return null;

  const candleTitle = candle.is_anonymous ? 'Анонимная свеча' : candle.title;

  return <CandleBreadcrumbList candleTitle={candleTitle} />;
}

