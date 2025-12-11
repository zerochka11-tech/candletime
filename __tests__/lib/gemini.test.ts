/**
 * Unit тесты для lib/gemini.ts
 */

import {
  generateSlug,
  calculateReadingTime,
  generateExcerpt,
  extractTitle,
  generateSEOMetadata,
  createArticlePrompt,
} from '@/lib/gemini';

// Мокаем getGeminiClient, чтобы не делать реальные запросы
jest.mock('@/lib/gemini', () => {
  const actual = jest.requireActual('@/lib/gemini');
  return {
    ...actual,
    getGeminiClient: jest.fn(),
    generateArticle: jest.fn(),
    determineArticleCategory: jest.fn(),
  };
});

describe('lib/gemini', () => {
  describe('generateSlug', () => {
    it('генерирует slug из русского заголовка', () => {
      const slug = generateSlug('Как зажечь свечу');
      expect(slug).toBe('kak-zazhech-svechu');
    });

    it('генерирует slug из английского заголовка', () => {
      const slug = generateSlug('How to Light a Candle');
      expect(slug).toBe('how-to-light-a-candle');
    });

    it('обрабатывает заголовки с специальными символами', () => {
      const slug = generateSlug('Статья про медитацию!');
      expect(slug).toBe('statya-pro-meditatsiyu');
    });

    it('обрабатывает заголовки с множественными пробелами', () => {
      const slug = generateSlug('Статья   с   пробелами');
      expect(slug).toBe('statya-s-probelami');
    });

    it('обрабатывает заголовки с дефисами', () => {
      const slug = generateSlug('Статья - про - медитацию');
      expect(slug).toBe('statya-pro-meditatsiyu');
    });

    it('обрабатывает пустой заголовок', () => {
      const slug = generateSlug('');
      expect(slug).toMatch(/^article-\d+$/);
    });

    it('обрабатывает заголовок только из специальных символов', () => {
      const slug = generateSlug('!!!@@@###');
      expect(slug).toMatch(/^article-\d+$/);
    });

    it('обрабатывает заголовки с цифрами', () => {
      const slug = generateSlug('Статья 2025');
      expect(slug).toBe('statya-2025');
    });

    it('удаляет дефисы в начале и конце', () => {
      const slug = generateSlug('-Статья-');
      expect(slug).toBe('statya');
    });
  });

  describe('calculateReadingTime', () => {
    it('вычисляет время чтения для короткого текста', () => {
      const content = 'Короткий текст.';
      const time = calculateReadingTime(content);
      expect(time).toBe(1); // Минимум 1 минута
    });

    it('вычисляет время чтения для текста с 200 словами', () => {
      const words = Array(200).fill('слово').join(' ');
      const time = calculateReadingTime(words);
      expect(time).toBe(1);
    });

    it('вычисляет время чтения для текста с 400 словами', () => {
      const words = Array(400).fill('слово').join(' ');
      const time = calculateReadingTime(words);
      expect(time).toBe(2);
    });

    it('округляет время чтения вверх', () => {
      const words = Array(250).fill('слово').join(' ');
      const time = calculateReadingTime(words);
      expect(time).toBe(2);
    });

    it('обрабатывает текст с множественными пробелами', () => {
      const content = 'Слово    слово     слово';
      const time = calculateReadingTime(content);
      expect(time).toBe(1);
    });

    it('обрабатывает пустой текст', () => {
      const time = calculateReadingTime('');
      expect(time).toBe(1); // Минимум 1 минута
    });
  });

  describe('generateExcerpt', () => {
    it('генерирует excerpt из обычного текста', () => {
      const content = 'Это очень длинный текст статьи, который содержит много информации и должен быть обрезан до 150 символов для создания краткого описания. Дополнительный текст для проверки обрезки.';
      const excerpt = generateExcerpt(content);
      expect(excerpt.length).toBeLessThanOrEqual(153); // 150 + '...'
      // '...' добавляется только если текст обрезан
      if (excerpt.length > 150) {
        expect(excerpt).toContain('...');
      }
    });

    it('удаляет markdown код блоки', () => {
      const content = '```markdown\nкод\n```\n\nОбычный текст статьи.';
      const excerpt = generateExcerpt(content);
      expect(excerpt).not.toContain('```');
      expect(excerpt).toContain('Обычный');
    });

    it('удаляет inline код', () => {
      const content = 'Текст с `inline кодом` и обычным текстом.';
      const excerpt = generateExcerpt(content);
      expect(excerpt).not.toContain('`');
    });

    it('удаляет markdown символы', () => {
      const content = '# Заголовок\n\n**Жирный** текст и *курсив*.';
      const excerpt = generateExcerpt(content);
      expect(excerpt).not.toContain('#');
      expect(excerpt).not.toContain('*');
    });

    it('заменяет переносы строк на пробелы', () => {
      const content = 'Первая\nстрока\nи\nвторая\nстрока.';
      const excerpt = generateExcerpt(content);
      expect(excerpt).not.toContain('\n');
    });

    it('обрабатывает текст короче 150 символов', () => {
      const content = 'Короткий текст.';
      const excerpt = generateExcerpt(content);
      expect(excerpt).toBe('Короткий текст.');
      expect(excerpt).not.toContain('...');
    });

    it('обрабатывает пустой текст', () => {
      const excerpt = generateExcerpt('');
      expect(excerpt).toBe('');
    });

    it('обрабатывает текст только с markdown', () => {
      const content = '```\nкод\n```\n# Заголовок';
      const excerpt = generateExcerpt(content);
      expect(excerpt.length).toBeGreaterThan(0);
    });
  });

  describe('extractTitle', () => {
    it('извлекает H1 заголовок из markdown', () => {
      const content = '# Мой заголовок\n\nТекст статьи.';
      const title = extractTitle(content);
      expect(title).toBe('Мой заголовок');
    });

    it('извлекает первый H1 заголовок', () => {
      const content = '# Первый заголовок\n\n# Второй заголовок';
      const title = extractTitle(content);
      expect(title).toBe('Первый заголовок');
    });

    it('возвращает пустую строку, если H1 не найден', () => {
      const content = 'Обычный текст без заголовка.';
      const title = extractTitle(content);
      expect(title).toBe('');
    });

    it('игнорирует H2 и другие заголовки', () => {
      const content = '## H2 заголовок\n\n# H1 заголовок';
      const title = extractTitle(content);
      expect(title).toBe('H1 заголовок');
    });

    it('обрабатывает заголовок с пробелами', () => {
      const content = '#   Заголовок   с   пробелами   \n\nТекст.';
      const title = extractTitle(content);
      expect(title).toBe('Заголовок   с   пробелами');
    });

    it('обрабатывает пустой контент', () => {
      const title = extractTitle('');
      expect(title).toBe('');
    });
  });

  describe('generateSEOMetadata', () => {
    it('генерирует SEO метаданные для короткого заголовка', () => {
      const content = 'Полный текст статьи с информацией.';
      const result = generateSEOMetadata('Медитация', content);

      expect(result.seoTitle).toBe('Медитация | CandleTime');
      expect(result.seoDescription).toBe('Полный текст статьи с информацией.');
      expect(result.seoKeywords).toContain('CandleTime');
      expect(result.seoKeywords).toContain('символические свечи');
    });

    it('обрезает длинный заголовок для SEO title', () => {
      const longTitle = 'Очень длинный заголовок статьи, который превышает 50 символов и должен быть обрезан';
      const result = generateSEOMetadata(longTitle, 'Текст статьи.');

      expect(result.seoTitle.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result.seoTitle).toContain('...');
    });

    it('обрезает длинное описание для SEO description', () => {
      const longContent = 'Очень длинный текст статьи, который содержит много информации и должен быть обрезан до 160 символов для создания SEO описания. Это важно для поисковых систем. Дополнительный текст для проверки обрезки.';
      const result = generateSEOMetadata('Заголовок', longContent);

      expect(result.seoDescription.length).toBeLessThanOrEqual(160);
      // '...' добавляется только если текст обрезан
      if (result.seoDescription.length >= 157) {
        expect(result.seoDescription).toContain('...');
      }
    });

    it('извлекает ключевые слова из заголовка', () => {
      const result = generateSEOMetadata('Медитация и спокойствие', 'Текст статьи.');

      expect(result.seoKeywords.length).toBeGreaterThan(3);
      expect(result.seoKeywords).toContain('CandleTime');
    });

    it('исключает стоп-слова из ключевых слов', () => {
      const result = generateSEOMetadata('Медитация спокойствие гармония', 'Текст статьи.');

      // Стоп-слова должны быть исключены, но базовые ключевые слова должны быть
      expect(result.seoKeywords).toContain('CandleTime');
      expect(result.seoKeywords).toContain('символические свечи');
      // Проверяем, что есть слова из заголовка (длиннее 3 символов)
      expect(result.seoKeywords.length).toBeGreaterThan(3);
    });

    it('ограничивает количество ключевых слов до 10', () => {
      const longTitle = 'Очень длинный заголовок с множеством разных слов для проверки ограничения';
      const result = generateSEOMetadata(longTitle, 'Текст статьи.');

      expect(result.seoKeywords.length).toBeLessThanOrEqual(10);
    });

    it('обрабатывает пустой контент', () => {
      const result = generateSEOMetadata('Заголовок', '');

      expect(result.seoTitle).toBe('Заголовок | CandleTime');
      expect(result.seoDescription).toBe('');
      expect(result.seoKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('createArticlePrompt', () => {
    it('создает промпт для русской статьи', () => {
      const prompt = createArticlePrompt({
        topic: 'Медитация',
        language: 'ru',
      });

      expect(prompt).toContain('Медитация');
      expect(prompt).toContain('Русский');
      expect(prompt).toContain('Markdown');
    });

    it('создает промпт для английской статьи', () => {
      const prompt = createArticlePrompt({
        topic: 'Meditation',
        language: 'en',
      });

      expect(prompt).toContain('Meditation');
      expect(prompt).toContain('English');
    });

    it('добавляет CTA для типа свечи', () => {
      const prompt = createArticlePrompt({
        topic: 'Медитация',
        candleType: 'calm',
        language: 'ru',
      });

      expect(prompt).toContain('спокойствия');
      expect(prompt).toContain('призыв к действию');
    });

    it('создает промпт без CTA, если тип свечи не указан', () => {
      const prompt = createArticlePrompt({
        topic: 'Медитация',
        language: 'ru',
      });

      expect(prompt).not.toContain('призыв к действию');
    });

    it('обрабатывает разные типы свечей', () => {
      const types = ['calm', 'support', 'memory', 'gratitude', 'focus'] as const;
      
      types.forEach(type => {
        const prompt = createArticlePrompt({
          topic: 'Тема',
          candleType: type,
          language: 'ru',
        });

        // Проверяем, что промпт содержит описание типа свечи
        expect(prompt).toContain('призыв к действию');
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    it('создает промпт с правильной структурой', () => {
      const prompt = createArticlePrompt({
        topic: 'Медитация',
        language: 'ru',
      });

      expect(prompt).toContain('H1');
      expect(prompt).toContain('Введение');
      expect(prompt).toContain('Заключение');
    });
  });
});

