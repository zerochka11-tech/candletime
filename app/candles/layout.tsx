import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Все свечи',
  description: 'Посмотри все активные символические свечи на CandleTime. Зажжённые свечи для памяти, поддержки, благодарности и спокойствия. Выбери свечу или создай свою.',
  path: '/candles',
  keywords: ['все свечи', 'активные свечи', 'символические свечи', 'просмотр свечей', 'свечи онлайн'],
});

export default function CandlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'Все свечи', url: `${siteUrl}/candles` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      {children}
    </>
  );
}

