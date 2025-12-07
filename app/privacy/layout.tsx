import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | CandleTime',
  description: 'Политика конфиденциальности CandleTime. Информация о сборе, использовании и защите персональных данных.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

