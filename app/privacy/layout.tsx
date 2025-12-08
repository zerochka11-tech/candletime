import type { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности CandleTime. Узнай, как мы собираем, используем и защищаем твои персональные данные. GDPR соответствие и управление cookies.',
  path: '/privacy',
  keywords: ['политика конфиденциальности', 'конфиденциальность', 'GDPR', 'защита данных', 'cookies'],
});

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'Политика конфиденциальности', url: `${siteUrl}/privacy` },
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

