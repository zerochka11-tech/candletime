import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList, generateMapStructuredData } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Карта свечей',
  description: 'Интерактивная карта мира, показывающая, откуда пользователи зажигают символические свечи. Увидьте глобальную активность сообщества CandleTime.',
  path: '/map',
  keywords: ['карта свечей', 'геолокация', 'мир', 'глобальная карта', 'CandleTime карта'],
});

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'Карта свечей', url: `${siteUrl}/map` },
  ]);

  const mapStructuredData = generateMapStructuredData({
    name: 'Карта свечей',
    description: 'Интерактивная карта мира, показывающая, откуда пользователи зажигают символические свечи. Увидьте глобальную активность сообщества CandleTime.',
    url: `${siteUrl}/map`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mapStructuredData) }}
      />
      {children}
    </>
  );
}

