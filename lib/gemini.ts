import { GoogleGenAI } from '@google/genai';

/**
 * Получить клиент Gemini API
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction
      ? 'GEMINI_API_KEY is not set in environment variables. Please add it in Vercel: Settings → Environment Variables. See GEMINI_PRODUCTION_SETUP.md for instructions.'
      : 'GEMINI_API_KEY is not set in environment variables. Please add it to your .env.local file. See GEMINI_SETUP.md for instructions.';
    throw new Error(errorMessage);
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Генерирует slug из заголовка
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Вычисляет время чтения статьи (200 слов в минуту)
 */
export function calculateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Генерирует excerpt из контента (первые 150 символов)
 */
export function generateExcerpt(content: string): string {
  // Удаляем Markdown разметку для excerpt
  const plainText = content
    .replace(/[#*\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  const excerpt = plainText.substring(0, 150).trim();
  return excerpt.length < plainText.length ? excerpt + '...' : excerpt;
}

/**
 * Извлекает H1 заголовок из Markdown контента
 */
export function extractTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.replace(/^# /, '').trim();
    }
  }
  return '';
}

/**
 * Генерирует SEO метаданные из заголовка и контента
 */
export function generateSEOMetadata(title: string, content: string): {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
} {
  // SEO Title: заголовок + бренд (если не слишком длинный)
  const seoTitle = title.length > 50 
    ? title.substring(0, 50).trim() + '...'
    : `${title} | CandleTime`;

  // SEO Description: первые 150-160 символов из контента
  const plainText = content
    .replace(/[#*\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  const seoDescription = plainText.length > 160
    ? plainText.substring(0, 157).trim() + '...'
    : plainText;

  // SEO Keywords: извлекаем ключевые слова из заголовка и контента
  const keywords = extractKeywords(title, content);

  return {
    seoTitle,
    seoDescription,
    seoKeywords: keywords,
  };
}

/**
 * Извлекает ключевые слова из текста
 */
function extractKeywords(title: string, content: string): string[] {
  const baseKeywords = [
    'CandleTime',
    'символические свечи',
    'онлайн свечи',
  ];

  // Извлекаем слова из заголовка (исключаем стоп-слова)
  const stopWords = new Set([
    'как', 'что', 'для', 'это', 'или', 'и', 'в', 'на', 'с', 'по', 'от', 'до',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  ]);

  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 3);

  return [...baseKeywords, ...titleWords].slice(0, 10);
}

/**
 * Создает промпт для Gemini API
 */
export function createArticlePrompt(params: {
  topic: string;
  candleType?: string;
  language?: 'ru' | 'en';
}): string {
  const { topic, candleType, language = 'ru' } = params;

  const candleTypeDescriptions: Record<string, { ru: string; en: string }> = {
    calm: {
      ru: 'Спокойствие - для умиротворения и гармонии',
      en: 'Calm - for peace and harmony',
    },
    support: {
      ru: 'Поддержка - чтобы поддержать кого-то',
      en: 'Support - to support someone',
    },
    memory: {
      ru: 'Память - в память о ком-то или о чем-то',
      en: 'Memory - in memory of someone or something',
    },
    gratitude: {
      ru: 'Благодарность - чтобы выразить благодарность',
      en: 'Gratitude - to express gratitude',
    },
    focus: {
      ru: 'Фокус - для концентрации и намерений',
      en: 'Focus - for concentration and intentions',
    },
  };

  const candleCTA = candleType
    ? language === 'ru'
      ? `\n\nВ конце статьи добавь мягкий призыв к действию с упоминанием символической свечи типа "${candleTypeDescriptions[candleType]?.ru || candleType}". Например: "Готовы начать? Зажгите свою первую свечу ${candleType === 'calm' ? 'спокойствия' : candleType === 'support' ? 'поддержки' : candleType === 'memory' ? 'памяти' : candleType === 'gratitude' ? 'благодарности' : 'фокуса'} прямо сейчас."`
      : `\n\nAt the end of the article, add a soft call to action mentioning a symbolic candle of type "${candleTypeDescriptions[candleType]?.en || candleType}".`
    : '';

  const prompt = `Ты - эксперт по написанию SEO-оптимизированных статей для сайта CandleTime.

CandleTime - это тихое место для зажигания символических свечей онлайн. Без ленты и лайков, только спокойный жест внимания.

Задача: Напиши SEO-статью на тему "${topic}".

Требования:
- Длина: 1200-1800 слов
- Формат: Markdown (используй H1 для главного заголовка, H2 для разделов, H3 для подразделов, списки, параграфы)
- Тон: спокойный, теплый, без пафоса
- Стиль: простой, человеческий, без инфобизнеса
- Язык: ${language === 'ru' ? 'Русский' : 'English'}
${candleCTA}

Структура статьи:
1. H1 заголовок (главный заголовок статьи - должен быть на первой строке, начинаться с "# ")
2. Введение (2-3 параграфа, объясняющие тему)
3. Основной контент (несколько разделов с H2, каждый раздел может содержать подразделы H3)
4. Практические советы или примеры (если применимо)
5. Заключение${candleType ? ' с призывом к действию' : ''}

Важно:
- Используй реальные примеры и практические советы
- Пиши естественно, как будто разговариваешь с читателем
- Избегай клише и общих фраз
- Структурируй информацию логично
- Используй списки и подзаголовки для лучшей читаемости

Верни только Markdown контент статьи, без дополнительных комментариев или объяснений.`;

  return prompt;
}

/**
 * Задержка в миллисекундах
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Проверяет, является ли ошибка rate limit
 */
function isRateLimitError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || error?.status || '';
  
  return (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('429') ||
    errorCode === 429 ||
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorMessage.includes('resource_exhausted')
  );
}

/**
 * Генерирует статью через Gemini API с retry механизмом
 */
export async function generateArticle(params: {
  topic: string;
  candleType?: string;
  language?: 'ru' | 'en';
}, retryCount = 0): Promise<{
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  readingTime: number;
  slug: string;
}> {
  const client = getGeminiClient();
  const prompt = createArticlePrompt(params);
  
  // Список моделей для fallback (от более новой к более старой)
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];
  
  const maxRetries = 3;
  const currentModelIndex = Math.min(retryCount, models.length - 1);
  const model = models[currentModelIndex];

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
    });

    // Извлекаем текст из ответа
    // Согласно документации, response.text должен содержать текст напрямую
    const generatedContent = response.text || '';
    
    if (!generatedContent) {
      throw new Error('Gemini API returned empty content');
    }

    // Извлекаем заголовок из H1
    const title = extractTitle(generatedContent) || params.topic;
    
    // Удаляем H1 из контента, если он там есть (он будет в title)
    const content = generatedContent
      .split('\n')
      .filter(line => !line.startsWith('# '))
      .join('\n')
      .trim();

    // Генерируем метаданные
    const { seoTitle, seoDescription, seoKeywords } = generateSEOMetadata(title, content);
    const excerpt = generateExcerpt(content);
    const readingTime = calculateReadingTime(content);
    const slug = generateSlug(title);

    return {
      title,
      content,
      excerpt,
      seoTitle,
      seoDescription,
      seoKeywords,
      readingTime,
      slug,
    };
  } catch (error: any) {
    console.error(`Error generating article with Gemini (model: ${model}, retry: ${retryCount}):`, error);
    
    // Обработка rate limit с retry
    if (isRateLimitError(error)) {
      if (retryCount < maxRetries) {
        // Экспоненциальная задержка: 2s, 4s, 8s
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limit hit. Retrying in ${delayMs}ms with model ${models[Math.min(retryCount + 1, models.length - 1)]}...`);
        
        await delay(delayMs);
        
        // Пробуем следующую модель или повторяем запрос
        return generateArticle(params, retryCount + 1);
      } else {
        // Все попытки исчерпаны
        throw new Error(
          'API rate limit exceeded. Пожалуйста, подождите несколько минут и попробуйте снова. ' +
          'Gemini API имеет ограничения на количество запросов в минуту.'
        );
      }
    }
    
    // Другие ошибки
    throw new Error(
      error.message || 'Failed to generate article. Please try again.'
    );
  }
}

