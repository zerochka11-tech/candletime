import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Мои свечи',
  description: 'Личный кабинет с историей твоих символических свечей на CandleTime. Управляй своими свечами, просматривай статистику и создавай новые.',
  path: '/dashboard',
  keywords: ['мои свечи', 'личный кабинет', 'история свечей', 'управление свечами'],
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

