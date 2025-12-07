import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'CandleTime',
  description: 'Тихое место, чтобы зажечь символическую свечу онлайн',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-1850">
        <SiteHeader />

        {/* КОНТЕНТ */}
        <main className="mx-auto max-w-5xl px-4 py-8 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
