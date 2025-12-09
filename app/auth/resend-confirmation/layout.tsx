import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Повторная отправка письма',
  description: 'Запроси новую ссылку подтверждения email для аккаунта CandleTime',
  path: '/auth/resend-confirmation',
  keywords: ['повторная отправка', 'подтверждение email', 'CandleTime'],
});

export default function ResendConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

