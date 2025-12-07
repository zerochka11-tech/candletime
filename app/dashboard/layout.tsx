import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Мои свечи',
  description: 'Личный кабинет с историей твоих символических свечей на CandleTime',
  path: '/dashboard',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

