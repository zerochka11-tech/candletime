import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Вход',
  description: 'Войди в свой аккаунт CandleTime, чтобы управлять своими символическими свечами, просматривать историю и создавать новые свечи.',
  path: '/auth/login',
  keywords: ['вход', 'авторизация', 'войти в аккаунт', 'CandleTime вход'],
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

