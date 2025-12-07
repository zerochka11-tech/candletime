import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  
  // Базовые мета-теги для страницы свечи
  // Динамические мета-теги будут добавлены через компонент DynamicMeta
  return generateBaseMetadata({
    title: 'Свеча',
    description: 'Просмотр символической свечи на CandleTime',
    path: `/candle/${id}`,
    type: 'article',
  });
}

export default function CandleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

