import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Analytics } from '@/components/Analytics';
import { CookieConsent } from '@/components/CookieConsent';
import { ThemeScript } from '@/components/ThemeScript';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { generateMetadata as generateBaseMetadata, generateOrganizationStructuredData } from '@/lib/seo';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const baseMetadata = generateBaseMetadata({
    title: t('title'),
    description: t('description'),
    path: locale === 'ru' ? '/' : `/${locale}`,
  });

  const keywords = locale === 'ru'
    ? ['свечи', 'символические свечи', 'онлайн свечи', 'медитация', 'внимание', 'спокойствие']
    : ['candles', 'symbolic candles', 'online candles', 'meditation', 'attention', 'calm'];

  return {
    ...baseMetadata,
    keywords,
    authors: [{ name: 'CandleTime' }],
    creator: 'CandleTime',
    publisher: 'CandleTime',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      languages: {
        'ru': 'https://candletime.ru',
        'en': 'https://candletime.ru/en',
        'x-default': 'https://candletime.ru',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        
        {/* Resource Hints для оптимизации загрузки */}
        <link rel="preconnect" href="https://candletime.ru" />
        <link rel="preconnect" href="https://vercel.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <link rel="alternate" hrefLang="ru" href="https://candletime.ru" />
        <link rel="alternate" hrefLang="en" href="https://candletime.ru/en" />
        <link rel="alternate" hrefLang="x-default" href="https://candletime.ru" />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <NextIntlClientProvider messages={messages}>
          <Analytics />
          <VercelAnalytics />
          <SiteHeader />
          <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
            {children}
          </main>
          <SiteFooter />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
