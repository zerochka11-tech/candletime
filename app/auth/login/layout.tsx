import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Вход',
  description: 'Войди в свой аккаунт CandleTime',
  path: '/auth/login',
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

