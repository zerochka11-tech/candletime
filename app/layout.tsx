import type { Metadata } from 'next';
import './globals.css';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Analytics } from '@/components/Analytics';
import { YandexMetrika } from '@/components/YandexMetrika';
import { CookieConsent } from '@/components/CookieConsent';
import { ThemeScript } from '@/components/ThemeScript';
import { generateMetadata as generateBaseMetadata, generateOrganizationStructuredData } from '@/lib/seo';

const baseMetadata = generateBaseMetadata({
  title: 'CandleTime - Зажги символическую свечу онлайн',
  description: 'Зажги символическую свечу онлайн. Тихое место для внимания и памяти без ленты и лайков. Создай свою свечу или посмотри другие.',
  path: '/',
});

export const metadata: Metadata = {
  ...baseMetadata,
  keywords: ['свечи', 'символические свечи', 'онлайн свечи', 'медитация', 'внимание', 'спокойствие'],
  authors: [{ name: 'CandleTime' }],
  creator: 'CandleTime',
  publisher: 'CandleTime',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        
        {/* Resource Hints для оптимизации загрузки */}
        <link rel="preconnect" href="https://candletime.ru" />
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <meta name="yandex-verification" content="c1fb551ad90d3556" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Analytics />
        <YandexMetrika />
        <SiteHeader />

        {/* КОНТЕНТ */}
        <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
        <VercelAnalytics />
      </body>
    </html>
  );
}
