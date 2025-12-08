import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'FAQ и Статьи',
  description: 'Часто задаваемые вопросы, руководства и SEO статьи о CandleTime. Узнайте, как зажечь символическую свечу, как работает сервис и многое другое.',
  path: '/faq',
});

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'FAQ и Статьи', url: `${siteUrl}/faq` },
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

