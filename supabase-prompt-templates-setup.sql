-- ============================================
-- SQL скрипт для создания таблицы промпт-шаблонов
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Создание таблицы для промпт-шаблонов
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Название шаблона
  description TEXT, -- Описание шаблона
  prompt TEXT NOT NULL, -- Сам промпт-шаблон (может содержать переменные типа {topic}, {candleType}, {language})
  variables JSONB DEFAULT '[]'::jsonb, -- Список переменных, которые используются в шаблоне (для UI)
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false NOT NULL, -- Шаблон по умолчанию
  is_system BOOLEAN DEFAULT false NOT NULL, -- Системный шаблон (нельзя удалить обычным пользователям)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_prompt_templates_author ON prompt_templates(author_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_default ON prompt_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_created_at ON prompt_templates(created_at DESC);

-- Включение Row Level Security (RLS)
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Политики для prompt_templates: все авторизованные пользователи могут читать шаблоны
CREATE POLICY "Authenticated users can read prompt templates"
  ON prompt_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Политика: авторизованные пользователи могут создавать шаблоны
CREATE POLICY "Authenticated users can create prompt templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Политика: автор может обновлять свой шаблон (или системные шаблоны могут обновлять только админы)
CREATE POLICY "Authors can update own prompt templates"
  ON prompt_templates FOR UPDATE
  USING (auth.uid() = author_id OR (is_system = false AND auth.uid() IS NOT NULL));

-- Политика: автор может удалять свой шаблон (системные шаблоны удалять нельзя)
CREATE POLICY "Authors can delete own prompt templates"
  ON prompt_templates FOR DELETE
  USING (auth.uid() = author_id AND is_system = false);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_prompt_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_prompt_templates_updated_at_trigger
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_templates_updated_at();

-- Вставка дефолтного системного шаблона (текущий промпт из кода)
INSERT INTO prompt_templates (name, description, prompt, variables, is_default, is_system, author_id) VALUES
  (
    'Стандартный шаблон',
    'Базовый шаблон для генерации SEO-статей о символических свечах',
    'Ты - эксперт по написанию SEO-оптимизированных статей для сайта CandleTime.

CandleTime - это тихое место для зажигания символических свечей онлайн. Без ленты и лайков, только спокойный жест внимания.

Задача: Напиши SEO-статью на тему "{topic}".

Требования:
- Длина: 1200-1800 слов
- Формат: Markdown (используй H1 для главного заголовка, H2 для разделов, H3 для подразделов, списки, параграфы)
- Тон: спокойный, теплый, без пафоса
- Стиль: простой, человеческий, без инфобизнеса
- Язык: {language}

{ctaSection}

Структура статьи:
1. H1 заголовок (главный заголовок статьи - должен быть на первой строке, начинаться с "# ")
2. Введение (2-3 параграфа, объясняющие тему)
3. Основной контент (несколько разделов с H2, каждый раздел может содержать подразделы H3)
4. Практические советы или примеры (если применимо)
5. Заключение{candleTypeCTA}

Важно:
- Используй реальные примеры и практические советы
- Пиши естественно, как будто разговариваешь с читателем
- Избегай клише и общих фраз
- Структурируй информацию логично
- Используй списки и подзаголовки для лучшей читаемости

Верни только Markdown контент статьи, без дополнительных комментариев или объяснений.',
    '["topic", "candleType", "language"]'::jsonb,
    true,
    true,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Комментарии к таблице
COMMENT ON TABLE prompt_templates IS 'Таблица для хранения промпт-шаблонов для генерации статей';
COMMENT ON COLUMN prompt_templates.prompt IS 'Промпт-шаблон с переменными в формате {variableName}';
COMMENT ON COLUMN prompt_templates.variables IS 'JSON массив с именами переменных, используемых в шаблоне';

