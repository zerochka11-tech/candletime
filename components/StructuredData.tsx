'use client';

import { generateHomePageStructuredData } from '@/lib/seo';

/**
 * Компонент для добавления структурированных данных на главную страницу
 */
export function HomePageStructuredData() {
  const structuredData = generateHomePageStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

