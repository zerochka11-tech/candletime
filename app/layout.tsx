import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Analytics } from '@/components/Analytics';
import { CookieConsent } from '@/components/CookieConsent';
import { generateMetadata as generateBaseMetadata, generateOrganizationStructuredData } from '@/lib/seo';

const baseMetadata = generateBaseMetadata({
  title: 'CandleTime',
  description: 'Тихое место, чтобы зажечь символическую свечу онлайн. Без ленты и лайков — только спокойный жест внимания.',
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
    <html lang="ru">
      <head>
        <meta name="google-site-verification" content="3vjdPzwkJwKsBjdNwjtKg2-qf31TK6Ymv7RMkjp0kTQ" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-1850">
        <Analytics />
        <SiteHeader />

        {/* КОНТЕНТ */}
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
