import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Зажечь свечу',
  description: 'Зажги свою символическую свечу на CandleTime. Выбери готовый шаблон или создай свою уникальную свечу.',
  path: '/light',
});

export default function LightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

