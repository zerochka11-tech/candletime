import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Подтверждение email',
  description: 'Подтверждение email адреса для аккаунта CandleTime',
  path: '/auth/confirm',
  keywords: ['подтверждение email', 'верификация', 'CandleTime'],
});

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

