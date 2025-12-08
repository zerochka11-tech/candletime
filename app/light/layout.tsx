import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList, generateHowToStructuredData } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'Зажечь свечу',
  description: 'Зажги свою символическую свечу онлайн на CandleTime. Выбери тип: память, поддержка, благодарность или спокойствие. Создай уникальное послание и поделись им.',
  path: '/light',
  keywords: ['зажечь свечу', 'создать свечу', 'символическая свеча', 'онлайн свечи', 'зажечь свечу онлайн', 'типы свечей'],
});

export default function LightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'Зажечь свечу', url: `${siteUrl}/light` },
  ]);

  // Структурированные данные HowTo для инструкции создания свечи
  const howToData = generateHowToStructuredData({
    name: 'Как зажечь символическую свечу на CandleTime',
    description: 'Пошаговая инструкция по созданию символической свечи онлайн на платформе CandleTime',
    url: `${siteUrl}/light`,
    steps: [
      {
        name: 'Выберите тип свечи',
        text: 'Выберите один из типов свечей: Спокойствие (для умиротворения), Поддержка (чтобы поддержать кого-то), Память (в память о ком-то), Благодарность (чтобы выразить благодарность) или Фокус (для концентрации и намерений).',
      },
      {
        name: 'Введите название свечи',
        text: 'Придумайте название для вашей свечи. Это может быть имя человека, событие или просто ваше намерение. Название должно быть не более 100 символов.',
      },
      {
        name: 'Добавьте сообщение (опционально)',
        text: 'Вы можете добавить сообщение к свече. Это может быть пожелание, молитва, благодарность или просто ваши мысли. Сообщение необязательно, но делает свечу более личной и значимой.',
      },
      {
        name: 'Выберите длительность горения',
        text: 'Выберите, как долго будет гореть ваша свеча: 1 час (для кратковременных намерений), 24 часа (на целый день) или 7 дней (на неделю).',
      },
      {
        name: 'Выберите видимость',
        text: 'Вы можете создать свечу публично (ваше имя будет отображаться) или анонимно (ваше имя не будет показано).',
      },
      {
        name: 'Нажмите "Зажечь свечу"',
        text: 'После заполнения всех полей нажмите кнопку "Зажечь свечу". Ваша свеча будет создана и станет доступна по уникальной ссылке, которой вы сможете поделиться с близкими.',
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToData) }}
      />
      {children}
    </>
  );
}

