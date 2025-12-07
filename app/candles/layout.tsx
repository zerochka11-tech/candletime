import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Все свечи',
  description: 'Посмотри все активные символические свечи, зажжённые на CandleTime',
  path: '/candles',
});

export default function CandlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

