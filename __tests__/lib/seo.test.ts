/**
 * Unit тесты для lib/seo.ts
 */

// Динамический импорт для правильной работы с переменными окружения
let generateMetadata: any;
let generateHomePageStructuredData: any;
let generateCandleStructuredData: any;
let generateOrganizationStructuredData: any;
let generateBreadcrumbList: any;
let generateCandlesItemList: any;
let generateArticleStructuredData: any;
let generateFAQPageStructuredData: any;
let generateHowToStructuredData: any;
let generateMapStructuredData: any;

beforeAll(async () => {
  // Убеждаемся, что переменная окружения установлена перед импортом модуля
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://candletime.ru';
  }
  
  // Сбрасываем кэш модулей для перезагрузки с правильной переменной окружения
  jest.resetModules();
  
  const seoModule = await import('@/lib/seo');
  generateMetadata = seoModule.generateMetadata;
  generateHomePageStructuredData = seoModule.generateHomePageStructuredData;
  generateCandleStructuredData = seoModule.generateCandleStructuredData;
  generateOrganizationStructuredData = seoModule.generateOrganizationStructuredData;
  generateBreadcrumbList = seoModule.generateBreadcrumbList;
  generateCandlesItemList = seoModule.generateCandlesItemList;
  generateArticleStructuredData = seoModule.generateArticleStructuredData;
  generateFAQPageStructuredData = seoModule.generateFAQPageStructuredData;
  generateHowToStructuredData = seoModule.generateHowToStructuredData;
  generateMapStructuredData = seoModule.generateMapStructuredData;
});

// Мокаем переменные окружения
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SITE_URL: 'https://candletime.ru',
  };
  // Перезагружаем модуль, чтобы он использовал новое значение
  jest.resetModules();
});

afterEach(() => {
  process.env = originalEnv;
  jest.resetModules();
});

describe('lib/seo', () => {
  describe('generateMetadata', () => {
    it('генерирует базовые мета-теги', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        description: 'Описание страницы',
      });

      expect(metadata.title).toBe('Моя страница | CandleTime');
      expect(metadata.description).toBe('Описание страницы');
    });

    it('не дублирует название сайта, если оно уже есть', () => {
      const metadata = generateMetadata({
        title: 'CandleTime - Главная',
      });

      expect(metadata.title).toBe('CandleTime - Главная');
    });

    it('использует дефолтное описание, если не указано', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
      });

      expect(metadata.description).toContain('Тихое место');
    });

    it('генерирует canonical URL', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        path: '/my-page',
      });

      expect(metadata.alternates?.canonical).toBe('https://candletime.ru/my-page');
    });

    it('генерирует Open Graph мета-теги', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        description: 'Описание',
        path: '/my-page',
      });

      expect(metadata.openGraph?.title).toBe('Моя страница | CandleTime');
      expect(metadata.openGraph?.description).toBe('Описание');
      expect(metadata.openGraph?.url).toBe('https://candletime.ru/my-page');
      expect(metadata.openGraph?.siteName).toBe('CandleTime');
    });

    it('генерирует Twitter Card мета-теги', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        description: 'Описание',
      });

      expect(metadata.twitter?.title).toBe('Моя страница | CandleTime');
      expect(metadata.twitter?.description).toBe('Описание');
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });

    it('использует кастомное изображение, если указано', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        image: 'https://example.com/image.jpg',
      });

      expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.jpg');
    });

    it('генерирует динамическое OG изображение, если не указано', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        description: 'Описание',
      });

      expect(metadata.openGraph?.images?.[0]?.url).toContain('/og?title=');
    });

    it('добавляет ключевые слова', () => {
      const metadata = generateMetadata({
        title: 'Моя страница',
        keywords: ['ключевое', 'слово'],
      });

      expect(metadata.keywords).toContain('ключевое');
      expect(metadata.keywords).toContain('слово');
      expect(metadata.keywords).toContain('CandleTime');
    });

    it('использует тип article для статей', () => {
      const metadata = generateMetadata({
        title: 'Статья',
        type: 'article',
      });

      expect(metadata.openGraph?.type).toBe('article');
    });
  });

  describe('generateHomePageStructuredData', () => {
    it('генерирует структурированные данные для главной страницы', () => {
      const data = generateHomePageStructuredData();

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('WebSite');
      expect(data.name).toBe('CandleTime');
      expect(data.url).toBe('https://candletime.ru');
    });

    it('включает SearchAction', () => {
      const data = generateHomePageStructuredData();

      expect(data.potentialAction).toBeDefined();
      expect(data.potentialAction?.['@type']).toBe('SearchAction');
    });
  });

  describe('generateCandleStructuredData', () => {
    it('генерирует структурированные данные для свечи', () => {
      const data = generateCandleStructuredData({
        title: 'Моя свеча',
        description: 'Описание свечи',
        createdAt: '2025-01-15T10:00:00Z',
        expiresAt: '2025-01-16T10:00:00Z',
        url: 'https://candletime.ru/candle/123',
      });

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('CreativeWork');
      expect(data.name).toBe('Моя свеча');
      expect(data.description).toBe('Описание свечи');
      expect(data.dateCreated).toBe('2025-01-15T10:00:00Z');
      expect(data.dateModified).toBe('2025-01-16T10:00:00Z');
      expect(data.url).toBe('https://candletime.ru/candle/123');
    });

    it('использует title как description, если description не указан', () => {
      const data = generateCandleStructuredData({
        title: 'Моя свеча',
        createdAt: '2025-01-15T10:00:00Z',
        expiresAt: '2025-01-16T10:00:00Z',
        url: 'https://candletime.ru/candle/123',
      });

      expect(data.description).toBe('Моя свеча');
    });
  });

  describe('generateOrganizationStructuredData', () => {
    it('генерирует структурированные данные для организации', () => {
      const data = generateOrganizationStructuredData();

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Organization');
      expect(data.name).toBe('CandleTime');
      expect(data.url).toBe('https://candletime.ru');
      expect(data.logo).toBe('https://candletime.ru/favicon.svg');
    });
  });

  describe('generateBreadcrumbList', () => {
    it('генерирует структурированные данные для хлебных крошек', () => {
      const data = generateBreadcrumbList([
        { name: 'Главная', url: 'https://candletime.ru' },
        { name: 'Свечи', url: 'https://candletime.ru/candles' },
      ]);

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('BreadcrumbList');
      expect(data.itemListElement).toHaveLength(2);
      expect(data.itemListElement[0].position).toBe(1);
      expect(data.itemListElement[0].name).toBe('Главная');
      expect(data.itemListElement[1].position).toBe(2);
      expect(data.itemListElement[1].name).toBe('Свечи');
    });

    it('обрабатывает пустой массив', () => {
      const data = generateBreadcrumbList([]);

      expect(data.itemListElement).toHaveLength(0);
    });
  });

  describe('generateCandlesItemList', () => {
    it('генерирует структурированные данные для списка свечей', () => {
      const data = generateCandlesItemList([
        { id: '123', title: 'Свеча 1' },
        { id: '456', title: 'Свеча 2' },
      ]);

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('ItemList');
      expect(data.numberOfItems).toBe(2);
      expect(data.itemListElement).toHaveLength(2);
      expect(data.itemListElement[0].item['@id']).toBe('https://candletime.ru/candle/123');
    });

    it('обрабатывает пустой массив', () => {
      const data = generateCandlesItemList([]);

      expect(data.numberOfItems).toBe(0);
      expect(data.itemListElement).toHaveLength(0);
    });
  });

  describe('generateArticleStructuredData', () => {
    it('генерирует структурированные данные для статьи', () => {
      const data = generateArticleStructuredData({
        title: 'Моя статья',
        description: 'Описание статьи',
        content: 'Полный текст статьи',
        publishedAt: '2025-01-15T10:00:00Z',
        modifiedAt: '2025-01-15T10:00:00Z',
        url: 'https://candletime.ru/faq/article',
        author: { name: 'CandleTime' },
      });

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Article');
      expect(data.headline).toBe('Моя статья');
      expect(data.description).toBe('Описание статьи');
      expect(data.articleBody).toBe('Полный текст статьи');
      expect(data.datePublished).toBe('2025-01-15T10:00:00Z');
      expect(data.author['@type']).toBe('Person');
      expect(data.author.name).toBe('CandleTime');
    });

    it('включает изображение, если указано', () => {
      const data = generateArticleStructuredData({
        title: 'Моя статья',
        content: 'Текст',
        publishedAt: '2025-01-15T10:00:00Z',
        modifiedAt: '2025-01-15T10:00:00Z',
        url: 'https://candletime.ru/faq/article',
        author: { name: 'CandleTime' },
        image: 'https://example.com/image.jpg',
      });

      expect(data.image).toBeDefined();
      expect(data.image?.['@type']).toBe('ImageObject');
      expect(data.image?.url).toBe('https://example.com/image.jpg');
    });

    it('включает URL автора, если указан', () => {
      const data = generateArticleStructuredData({
        title: 'Моя статья',
        content: 'Текст',
        publishedAt: '2025-01-15T10:00:00Z',
        modifiedAt: '2025-01-15T10:00:00Z',
        url: 'https://candletime.ru/faq/article',
        author: { name: 'CandleTime', url: 'https://candletime.ru' },
      });

      expect(data.author.url).toBe('https://candletime.ru');
    });
  });

  describe('generateFAQPageStructuredData', () => {
    it('генерирует структурированные данные для FAQ страницы', () => {
      const data = generateFAQPageStructuredData([
        { question: 'Что такое CandleTime?', answer: 'Это сервис...' },
        { question: 'Как зажечь свечу?', answer: 'Перейдите на страницу...' },
      ]);

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('FAQPage');
      expect(data.mainEntity).toHaveLength(2);
      expect(data.mainEntity[0]['@type']).toBe('Question');
      expect(data.mainEntity[0].name).toBe('Что такое CandleTime?');
      expect(data.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    });

    it('обрабатывает пустой массив', () => {
      const data = generateFAQPageStructuredData([]);

      expect(data.mainEntity).toHaveLength(0);
    });
  });

  describe('generateHowToStructuredData', () => {
    it('генерирует структурированные данные для инструкции', () => {
      const data = generateHowToStructuredData({
        name: 'Как зажечь свечу',
        description: 'Пошаговая инструкция',
        steps: [
          { name: 'Шаг 1', text: 'Выберите тип свечи' },
          { name: 'Шаг 2', text: 'Введите название' },
        ],
        url: 'https://candletime.ru/light',
      });

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('HowTo');
      expect(data.name).toBe('Как зажечь свечу');
      expect(data.step).toHaveLength(2);
      expect(data.step[0].position).toBe(1);
      expect(data.step[0].name).toBe('Шаг 1');
    });

    it('обрабатывает пустой массив шагов', () => {
      const data = generateHowToStructuredData({
        name: 'Инструкция',
        description: 'Описание',
        steps: [],
        url: 'https://candletime.ru/light',
      });

      expect(data.step).toHaveLength(0);
    });
  });

  describe('generateMapStructuredData', () => {
    it('генерирует структурированные данные для карты', () => {
      const data = generateMapStructuredData({
        name: 'Карта свечей',
        description: 'Интерактивная карта',
        url: 'https://candletime.ru/map',
        numberOfItems: 150,
      });

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('WebPage');
      expect(data.name).toBe('Карта свечей');
      expect(data.mainEntity['@type']).toBe('ItemList');
      expect(data.mainEntity.numberOfItems).toBe(150);
    });

    it('работает без numberOfItems', () => {
      const data = generateMapStructuredData({
        name: 'Карта свечей',
        description: 'Интерактивная карта',
        url: 'https://candletime.ru/map',
      });

      expect(data.mainEntity.numberOfItems).toBeUndefined();
    });
  });
});

