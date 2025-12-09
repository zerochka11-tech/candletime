// scripts/generate-seo-article.ts
//
// Запуск:
// npx ts-node scripts/generate-seo-article.ts \
//   --slug practice-gratitude-digital-candle \
//   --title "Практика благодарности: как начать с простой цифровой свечи" \
//   --h1 "Практика благодарности: как начать с простой цифровой свечи" \
//   --candleType gratitude \
//   --language ru

import fs from 'fs';
import path from 'path';
import process from 'process';
import OpenAI from 'openai';

// ----- Разбор аргументов CLI -----

type CLIArgs = {
  slug: string;
  title: string;
  h1: string;
  candleType: 'calm' | 'support' | 'memory' | 'gratitude' | 'focus';
  language: 'ru' | 'en';
};

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const map: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (!key?.startsWith('--') || !val) continue;
    map[key.replace(/^--/, '')] = val;
  }

  if (!map.slug || !map.title || !map.h1) {
    console.error(
      'Usage: ts-node scripts/generate-seo-article.ts ' +
        '--slug my-article --title "Title" --h1 "H1" --candleType calm --language ru'
    );
    process.exit(1);
  }

  const candleType =
    (map.candleType as CLIArgs['candleType']) || 'calm';
  const language =
    (map.language as CLIArgs['language']) || 'ru';

  return {
    slug: map.slug,
    title: map.title,
    h1: map.h1,
    candleType,
    language,
  };
}

// ----- Промпт-шаблон -----

function buildPrompt(params: CLIArgs) {
  const { h1, candleType, language } = params;

  const candleLabelMap: Record<string, string> = {
    calm: 'Calm (спокойствие)',
    support: 'Support (поддержка)',
    memory: 'Memory (память)',
    gratitude: 'Gratitude (благодарность)',
    focus: 'Focus (фокус)',
  };

  const ctaMap: Record<string, Record<string, string>> = {
    ru: {
      calm:
        'В конце статьи предложи мягкий призыв: зажечь свечу Calm на сайте Online Candles как небольшой ритуал спокойствия.',
      support:
        'В конце статьи предложи мягкий призыв: зажечь свечу Support на сайте Online Candles как тихий жест поддержки.',
      memory:
        'В конце статьи предложи мягкий призыв: зажечь свечу Memory на сайте Online Candles, чтобы отметить важный момент или память.',
      gratitude:
        'В конце статьи предложи мягкий призыв: зажечь свечу Gratitude на сайте Online Candles как ритуал благодарности.',
      focus:
        'В конце статьи предложи мягкий призыв: зажечь свечу Focus на сайте Online Candles как ритуал концентрации.',
    },
    en: {
      calm:
        'At the end of the article, add a soft CTA: invite the reader to light a Calm candle on Online Candles as a small ritual of calm.',
      support:
        'At the end of the article, add a soft CTA: invite the reader to light a Support candle on Online Candles as a quiet gesture of support.',
      memory:
        'At the end of the article, add a soft CTA: invite the reader to light a Memory candle on Online Candles to gently mark a meaningful moment.',
      gratitude:
        'At the end of the article, add a soft CTA: invite the reader to light a Gratitude candle on Online Candles as a gratitude ritual.',
      focus:
        'At the end of the article, add a soft CTA: invite the reader to light a Focus candle on Online Candles as a focus ritual.',
    },
  };

  const lang = language === 'en' ? 'English' : 'Russian';

  return `
You are an SEO copywriter and UX writer for a calm micro-service called Online Candles (CandleTime).

The product: a quiet place to light a symbolic online candle (types: Calm, Support, Memory, Gratitude, Focus).

Write a long-form SEO article in ${lang}.

Main requirements:

- Use H1 exactly as: "${h1}"
- Use clear hierarchy with H2 and H3 headings.
- Tone of voice: calm, warm, non-pathos, non-religious, no esoterics.
- Style: simple, human, not "infobusiness", no clickbait, no hard selling.
- Length: 1200–1800 words.
- Format: valid Markdown (H1, H2, H3, lists, paragraphs).
- Avoid generic filler like "In conclusion" clichés — keep it natural.

IMPORTANT:
- The article should be relevant to the concept of symbolic candles and small digital rituals.
- Occasionally mention that the reader can use a simple online candle ritual instead of complex practices.
- Do NOT describe the implementation details of the service (no code, no technical stuff).
- Talk about emotions, routines, rituals, everyday life situations.

Target candle type for the CTA:
- Candle type: ${candleLabelMap[candleType]}

CTA instruction:
- ${ctaMap[language][candleType]}

Output ONLY Markdown with:
- one H1
- several H2 and H3 blocks
- final CTA in a separate paragraph at the end.
`;
}

// ----- Основная логика -----

async function main() {
  const params = parseArgs();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  const prompt = buildPrompt(params);

  console.log('→ Generating article for:', params.title);

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a senior SEO copywriter and content strategist for a calm online candles service.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  const content =
    completion.choices[0]?.message?.content?.trim() ?? '';

  if (!content) {
    console.error('Empty response from OpenAI');
    process.exit(1);
  }

  // Сохранение файла
  const outDir = path.join(process.cwd(), 'seo-articles');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filePath = path.join(outDir, `${params.slug}.md`);
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✅ Article generated and saved to:', filePath);
  console.log(`📄 File size: ${content.length} characters`);
  console.log(`📊 Word count: ~${content.split(/\s+/).length} words`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

