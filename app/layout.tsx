import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-1850">
        <SiteHeader />

        {/* КОНТЕНТ */}
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
