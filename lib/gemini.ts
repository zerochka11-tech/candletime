import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Создает и возвращает клиент Google Gemini API
 * 
 * @returns Экземпляр GoogleGenerativeAI
 * @throws {Error} Если GEMINI_API_KEY не установлен в переменных окружения
 * 
 * @example
 * ```typescript
 * const client = getGeminiClient();
 * const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
 * ```
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

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Транслитерация кириллицы в латиницу для slug
 */
function transliterate(text: string): string {
  const transliterationMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('');
}

/**
 * Генерирует URL-friendly slug из заголовка с поддержкой кириллицы
 * 
 * @param title - Заголовок статьи (может содержать кириллицу)
 * @returns Slug в формате lowercase с дефисами (например: 'kak-zazhech-svechu')
 *          Если заголовок пустой, возвращает 'article-{timestamp}'
 * 
 * @example
 * ```typescript
 * const slug = generateSlug('Как зажечь свечу');
 * // Возвращает: 'kak-zazhech-svechu'
 * ```
 */
export function generateSlug(title: string): string {
  if (!title || title.trim().length === 0) {
    return 'article-' + Date.now();
  }

  let slug = title
    .toLowerCase()
    .trim();

  // Транслитерируем кириллицу
  slug = transliterate(slug);

  // Удаляем все символы, кроме латинских букв, цифр, дефисов и пробелов
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Заменяем пробелы и множественные дефисы на один дефис
  slug = slug.replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце

  // Если slug пустой после обработки, создаем из timestamp
  if (!slug || slug.length === 0) {
    slug = 'article-' + Date.now();
  }

  return slug;
}

/**
 * Вычисляет примерное время чтения статьи (200 слов в минуту)
 * 
 * @param content - Текст статьи
 * @returns Время чтения в минутах (минимум 1 минута)
 * 
 * @example
 * ```typescript
 * const time = calculateReadingTime('Длинный текст статьи...');
 * // Возвращает: 5 (минут)
 * ```
 */
export function calculateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Генерирует краткое описание (excerpt) из контента статьи
 * Удаляет markdown разметку и возвращает первые 150 символов
 * 
 * @param content - Полный текст статьи в Markdown формате
 * @returns Краткое описание (первые 150 символов) с '...' в конце, если текст обрезан
 * 
 * @example
 * ```typescript
 * const excerpt = generateExcerpt('# Заголовок\n\nПолный текст статьи...');
 * // Возвращает: 'Полный текст статьи...' (первые 150 символов)
 * ```
 */
export function generateExcerpt(content: string): string {
  if (!content || content.trim().length === 0) {
    return '';
  }

  // Удаляем markdown код блоки (```markdown ... ```)
  let plainText = content
    .replace(/```[\w]*\n[\s\S]*?```/g, '') // Удаляем все код блоки
    .replace(/```[\w]*/g, '') // Удаляем оставшиеся открывающие ```
    .replace(/`[^`]+`/g, '') // Удаляем inline код
    .replace(/[#*\[\]()]/g, '') // Удаляем markdown символы
    .replace(/\n+/g, ' ') // Заменяем переносы строк на пробелы
    .replace(/\s+/g, ' ') // Удаляем множественные пробелы
    .trim();
  
  // Если после очистки текст пустой, берем первые 150 символов без обработки
  if (plainText.length === 0) {
    plainText = content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  const excerpt = plainText.substring(0, 150).trim();
  return excerpt.length < plainText.length ? excerpt + '...' : excerpt;
}

/**
 * Извлекает H1 заголовок из Markdown контента
 * 
 * @param content - Текст в Markdown формате
 * @returns Заголовок H1 без символа '#' или пустая строка, если H1 не найден
 * 
 * @example
 * ```typescript
 * const title = extractTitle('# Мой заголовок\n\nТекст...');
 * // Возвращает: 'Мой заголовок'
 * ```
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
 * Генерирует SEO метаданные (title, description, keywords) из заголовка и контента
 * 
 * @param title - Заголовок статьи
 * @param content - Полный текст статьи
 * @returns Объект с SEO title, description и keywords
 * 
 * @example
 * ```typescript
 * const seo = generateSEOMetadata('Как зажечь свечу', 'Полный текст...');
 * // Возвращает: { seoTitle: 'Как зажечь свечу | CandleTime', seoDescription: '...', seoKeywords: [...] }
 * ```
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
 * Создает промпт для генерации статьи через Gemini API
 * 
 * @param params - Параметры генерации
 * @param params.topic - Тема статьи
 * @param params.candleType - Тип свечи для CTA (опционально)
 * @param params.language - Язык статьи ('ru' или 'en', по умолчанию 'ru')
 * @returns Готовый промпт для отправки в Gemini API
 * 
 * @example
 * ```typescript
 * const prompt = createArticlePrompt({
 *   topic: 'Медитация',
 *   candleType: 'calm',
 *   language: 'ru'
 * });
 * ```
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
 * Поддерживает как стандартный режим, так и кастомный промпт
 */
/**
 * Определяет категорию статьи на основе заголовка и контента
 */
async function determineArticleCategory(title: string, content: string): Promise<string | null> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Проанализируй следующую статью и определи, к какой категории она относится.

Заголовок: ${title}

Контент (первые 500 символов): ${content.substring(0, 500)}

Доступные категории:
1. FAQ (slug: "faq") - Часто задаваемые вопросы, ответы на вопросы пользователей
2. Руководства (slug: "guides") - Пошаговые инструкции и практические руководства
3. SEO (slug: "seo") - Статьи о личностном росте, эффективности, достижении целей
4. Новости (slug: "news") - Новые практики, тренды, исследования

Верни ТОЛЬКО slug категории (faq, guides, seo или news) без дополнительных объяснений. Если не можешь определить, верни "faq".`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim().toLowerCase();
    
    // Проверяем, что ответ является валидным slug категории
    const validSlugs = ['faq', 'guides', 'seo', 'news'];
    const categorySlug = validSlugs.find(slug => response.includes(slug)) || 'faq';
    
    return categorySlug;
  } catch (error) {
    console.error('Error determining article category:', error);
    // В случае ошибки возвращаем FAQ как категорию по умолчанию
    return 'faq';
  }
}

/**
 * Генерирует статью через Gemini API с автоматическим retry при rate limit
 * 
 * @param params - Параметры генерации статьи
 * @param params.topic - Тема статьи (используется если customPrompt не указан)
 * @param params.candleType - Тип свечи для CTA (опционально)
 * @param params.language - Язык статьи ('ru' или 'en')
 * @param params.customPrompt - Кастомный промпт с уже подставленными переменными (опционально)
 * @param retryCount - Количество попыток (внутренний параметр, не передавать вручную)
 * @returns Объект с полной статьей и метаданными
 * @throws {Error} Если генерация не удалась после всех попыток
 * 
 * @example
 * ```typescript
 * const article = await generateArticle({
 *   topic: 'Медитация',
 *   candleType: 'calm',
 *   language: 'ru'
 * });
 * // Возвращает: { title, content, excerpt, seoTitle, seoDescription, seoKeywords, readingTime, slug, categorySlug }
 * ```
 */
export async function generateArticle(params: {
  topic?: string;
  candleType?: string;
  language?: 'ru' | 'en';
  customPrompt?: string; // Кастомный промпт (уже с подставленными переменными)
}, retryCount = 0): Promise<{
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  readingTime: number;
  slug: string;
  categorySlug: string | null;
}> {
  const client = getGeminiClient();
  
  // Если передан кастомный промпт, используем его, иначе создаем стандартный
  const prompt = params.customPrompt || createArticlePrompt({
    topic: params.topic || 'Статья',
    candleType: params.candleType,
    language: params.language || 'ru',
  });
  
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
    // Получаем модель
    const genModel = client.getGenerativeModel({ model });
    
    // Генерируем контент
    const result = await genModel.generateContent(prompt);
    const response = result.response;
    
    // Извлекаем текст из ответа
    const generatedContent = response.text() || '';
    
    if (!generatedContent) {
      throw new Error('Gemini API returned empty content');
    }

    // Извлекаем заголовок из H1
    const extractedTitle = extractTitle(generatedContent);
    const title = extractedTitle || params.topic || 'Статья без названия';
    
    // Удаляем H1 из контента, если он там есть (он будет в title)
    // Более надежное удаление: ищем H1 в начале контента (с учетом пробелов)
    let content = generatedContent;
    if (extractedTitle) {
      // Удаляем H1 заголовок, который совпадает с извлеченным title
      // Ищем строку, которая начинается с # и содержит title
      const h1Pattern = new RegExp(`^#+\\s*${extractedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
      content = content.replace(h1Pattern, '').trim();
      
      // Также удаляем любую строку, которая начинается с # в начале контента (на случай, если title не совпал)
      const lines = content.split('\n');
      if (lines[0] && lines[0].trim().startsWith('#')) {
        lines.shift();
        content = lines.join('\n').trim();
      }
    } else {
      // Если title не извлечен, просто удаляем первую строку с #, если она есть
      const lines = content.split('\n');
      if (lines[0] && lines[0].trim().startsWith('#')) {
        lines.shift();
        content = lines.join('\n').trim();
      }
    }

    // Удаляем markdown код блоки из начала контента, если они есть
    // Иногда Gemini возвращает контент в формате ```markdown ... ```
    content = content
      .replace(/^```[\w]*\n?/i, '') // Удаляем открывающий ```markdown
      .replace(/\n?```\s*$/i, '') // Удаляем закрывающий ```
      .trim();

    // Проверяем, что контент не пустой
    if (!content || content.trim().length === 0) {
      throw new Error('Generated content is empty. Please check the prompt template.');
    }

    // Генерируем метаданные
    const { seoTitle, seoDescription, seoKeywords } = generateSEOMetadata(title, content);
    const excerpt = generateExcerpt(content);
    const readingTime = calculateReadingTime(content);
    const slug = generateSlug(title);

    // Проверяем, что slug не пустой
    if (!slug || slug.trim().length === 0) {
      throw new Error('Failed to generate slug from title. Title: ' + title);
    }

    // Определяем категорию статьи на основе заголовка и контента
    const categorySlug = await determineArticleCategory(title, content);

    return {
      title,
      content,
      excerpt,
      seoTitle,
      seoDescription,
      seoKeywords,
      readingTime,
      slug,
      categorySlug,
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

