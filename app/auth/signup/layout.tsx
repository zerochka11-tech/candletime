import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Регистрация',
  description: 'Создай аккаунт на CandleTime и сохраняй историю своих символических свечей. Управляй свечами, просматривай статистику и создавай новые.',
  path: '/auth/signup',
  keywords: ['регистрация', 'создать аккаунт', 'зарегистрироваться', 'CandleTime регистрация'],
});

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

