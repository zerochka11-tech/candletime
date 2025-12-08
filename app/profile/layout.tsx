import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мой профиль | CandleTime',
  description: 'Управление аккаунтом, просмотр статистики и настройки профиля на CandleTime',
  openGraph: {
    title: 'Мой профиль | CandleTime',
    description: 'Управление аккаунтом и просмотр статистики',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

