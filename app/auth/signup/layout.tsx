import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Регистрация',
  description: 'Создай аккаунт на CandleTime и сохраняй историю своих свечей',
  path: '/auth/signup',
});

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

