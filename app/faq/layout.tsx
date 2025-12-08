import { Metadata } from 'next';
import { generateMetadata as generateBaseMetadata, generateBreadcrumbList, generateFAQPageStructuredData } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://candletime.ru';

export const metadata: Metadata = generateBaseMetadata({
  title: 'FAQ и Статьи',
  description: 'Часто задаваемые вопросы, руководства и SEO статьи о CandleTime. Узнайте, как зажечь символическую свечу, как работает сервис и многое другое.',
  path: '/faq',
  keywords: ['FAQ', 'часто задаваемые вопросы', 'статьи', 'руководства', 'помощь', 'CandleTime FAQ'],
});

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbData = generateBreadcrumbList([
    { name: 'Главная', url: siteUrl },
    { name: 'FAQ и Статьи', url: `${siteUrl}/faq` },
  ]);

  // Базовые FAQ вопросы для структурированных данных
  const faqItems = [
    {
      question: 'Что такое символические свечи?',
      answer: 'Символические свечи — это виртуальные свечи, которые создаются онлайн для выражения эмоций, намерений, памяти или поддержки. Они объединяют древнюю традицию зажигания свечей с современными цифровыми технологиями.',
    },
    {
      question: 'Как создать символическую свечу на CandleTime?',
      answer: 'Перейдите на страницу "Зажечь свечу", выберите тип свечи (Спокойствие, Поддержка, Память, Благодарность или Фокус), введите название и опциональное сообщение, выберите длительность горения и нажмите "Зажечь свечу".',
    },
    {
      question: 'Можно ли создать анонимную свечу?',
      answer: 'Да, на CandleTime вы можете создать анонимную свечу. В этом случае ваше имя не будет отображаться, но свеча будет видна другим пользователям.',
    },
    {
      question: 'Сколько времени горит свеча?',
      answer: 'Вы можете выбрать длительность горения: 1 час, 24 часа или 7 дней. После истечения времени свеча автоматически погаснет, но останется видимой в истории.',
    },
    {
      question: 'Можно ли погасить свечу раньше времени?',
      answer: 'Да, если вы создали свечу, войдя в аккаунт, вы можете погасить её вручную в разделе "Мои свечи" в любое время.',
    },
  ];

  const faqData = generateFAQPageStructuredData(faqItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      {children}
    </>
  );
}

