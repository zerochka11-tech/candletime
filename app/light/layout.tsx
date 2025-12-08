import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Зажечь свечу',
  description: 'Зажги свою символическую свечу онлайн на CandleTime. Выбери тип: память, поддержка, благодарность или спокойствие. Создай уникальное послание и поделись им.',
  path: '/light',
});

export default function LightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'Зажечь свечу', url: `${siteUrl}/light` },
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

