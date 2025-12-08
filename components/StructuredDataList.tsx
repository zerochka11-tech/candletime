'use client';

import { useEffect } from 'react';
import { generateCandlesItemList, generateBreadcrumbList } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

/**
 * Компонент для добавления ItemList структурированных данных на страницу /candles
 */
export function CandlesItemList({ candles }: { candles: Array<{ id: string; title: string }> }) {
  useEffect(() => {
    if (candles.length === 0) return;

    const itemListData = generateCandlesItemList(candles);

    let script = document.querySelector('script[type="application/ld+json"][data-itemlist]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-itemlist', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(itemListData);
  }, [candles]);

  return null;
}

/**
 * Компонент для добавления BreadcrumbList на страницу свечи
 */
export function CandleBreadcrumbList({ candleTitle }: { candleTitle: string }) {
  useEffect(() => {
    const breadcrumbData = generateBreadcrumbList([
      { name: 'Главная', url: siteUrl },
      { name: 'Все свечи', url: `${siteUrl}/candles` },
      { name: candleTitle, url: window.location.href },
    ]);

    let script = document.querySelector('script[type="application/ld+json"][data-breadcrumb-candle]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-breadcrumb-candle', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbData);
  }, [candleTitle]);

  return null;
}

