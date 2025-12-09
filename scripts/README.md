# SEO Article Generator

Автоматический генератор SEO-статей для сайта CandleTime с использованием OpenAI.

## Установка зависимостей

```bash
npm install
```

Это установит необходимые пакеты:
- `openai` - для работы с OpenAI API
- `ts-node` - для запуска TypeScript файлов

## Настройка

1. Добавьте ваш OpenAI API ключ в `.env.local` (или `.env`):

```env
OPENAI_API_KEY=sk-...
```

## Использование

### Базовый запуск

```bash
npm run generate:seo -- \
  --slug practice-gratitude-digital-candle \
  --title "Практика благодарности: как начать с простой цифровой свечи" \
  --h1 "Практика благодарности: как начать с простой цифровой свечи" \
  --candleType gratitude \
  --language ru
```

### Параметры

- `--slug` (обязательно) - уникальный идентификатор статьи (используется для имени файла)
- `--title` (обязательно) - мета-заголовок статьи
- `--h1` (обязательно) - заголовок H1 статьи
- `--candleType` (опционально, по умолчанию: `calm`) - тип свечи для CTA:
  - `calm` - спокойствие
  - `support` - поддержка
  - `memory` - память
  - `gratitude` - благодарность
  - `focus` - фокус
- `--language` (опционально, по умолчанию: `ru`) - язык статьи:
  - `ru` - русский
  - `en` - английский

### Примеры

**Русская статья про спокойствие:**
```bash
npm run generate:seo -- \
  --slug calm-mindfulness-techniques \
  --title "Техники осознанности для спокойствия" \
  --h1 "Техники осознанности для спокойствия в повседневной жизни" \
  --candleType calm \
  --language ru
```

**Английская статья про фокус:**
```bash
npm run generate:seo -- \
  --slug focus-productivity-digital-rituals \
  --title "Focus and Productivity: Digital Rituals for Better Concentration" \
  --h1 "Focus and Productivity: Digital Rituals for Better Concentration" \
  --candleType focus \
  --language en
```

**Статья про память:**
```bash
npm run generate:seo -- \
  --slug remembering-important-moments \
  --title "Как помнить важные моменты: цифровые ритуалы памяти" \
  --h1 "Как помнить важные моменты: цифровые ритуалы памяти" \
  --candleType memory \
  --language ru
```

## Результат

Сгенерированная статья сохраняется в папку `seo-articles/` с именем `{slug}.md`.

Например, для `--slug practice-gratitude-digital-candle` будет создан файл:
```
seo-articles/practice-gratitude-digital-candle.md
```

## Что дальше?

После генерации статьи вы можете:

1. **Проверить и отредактировать** статью вручную
2. **Загрузить в Supabase** (если есть таблица `articles` или `seo_articles`)
3. **Добавить в систему FAQ/Блога** через админ-панель
4. **Опубликовать статически** через систему контента

## Особенности генерации

- **Длина статьи:** 1200-1800 слов
- **Формат:** Markdown (H1, H2, H3, списки, параграфы)
- **Тон:** спокойный, теплый, без пафоса, не религиозный, без эзотерики
- **Стиль:** простой, человеческий, без инфобизнеса и кликбейта
- **CTA:** мягкий призыв к действию в конце статьи

## Технические детали

- Используется модель `gpt-4o` от OpenAI
- Temperature: 0.7 (для баланса между креативностью и структурированностью)
- Промпт оптимизирован для генерации SEO-контента под специфику сервиса CandleTime

