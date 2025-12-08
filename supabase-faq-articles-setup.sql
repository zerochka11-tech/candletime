-- ============================================
-- SQL скрипт для создания таблиц FAQ/Статей
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Создание таблицы для категорий статей
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Создание таблицы для статей/FAQ
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT, -- Краткое описание для превью
  content TEXT NOT NULL, -- Полный контент статьи (Markdown или HTML)
  category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false NOT NULL, -- Опубликована ли статья
  published_at TIMESTAMPTZ, -- Дата публикации
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL, -- Счетчик просмотров
  seo_title TEXT, -- SEO заголовок (если отличается от title)
  seo_description TEXT, -- SEO описание
  seo_keywords TEXT[], -- Массив ключевых слов
  featured_image_url TEXT, -- URL изображения для превью
  reading_time INTEGER -- Время чтения в минутах
);

-- Создание таблицы для тегов
CREATE TABLE IF NOT EXISTS article_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Связующая таблица для тегов статей (many-to-many)
CREATE TABLE IF NOT EXISTS article_tag_relations (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES article_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published, published_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);
CREATE INDEX IF NOT EXISTS idx_article_tags_slug ON article_tags(slug);

-- Включение Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tag_relations ENABLE ROW LEVEL SECURITY;

-- Политики для articles: все могут читать опубликованные статьи
CREATE POLICY "Anyone can read published articles"
  ON articles FOR SELECT
  USING (published = true AND published_at IS NOT NULL AND published_at <= NOW());

-- Политики для article_categories: все могут читать
CREATE POLICY "Anyone can read categories"
  ON article_categories FOR SELECT
  USING (true);

-- Политики для article_tags: все могут читать
CREATE POLICY "Anyone can read tags"
  ON article_tags FOR SELECT
  USING (true);

-- Политики для article_tag_relations: все могут читать
CREATE POLICY "Anyone can read tag relations"
  ON article_tag_relations FOR SELECT
  USING (true);

-- Политика: только авторы могут создавать статьи (или админы)
-- Для начала разрешим всем авторизованным пользователям
CREATE POLICY "Authenticated users can create articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Политика: только автор может обновлять свою статью
CREATE POLICY "Authors can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id);

-- Политика: только автор может удалять свою статью
CREATE POLICY "Authors can delete own articles"
  ON articles FOR DELETE
  USING (auth.uid() = author_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_articles_updated_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();

-- Функция для увеличения счетчика просмотров
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET views_count = views_count + 1
  WHERE id = article_uuid AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Вставка начальных категорий
INSERT INTO article_categories (name, slug, description) VALUES
  ('FAQ', 'faq', 'Часто задаваемые вопросы'),
  ('SEO', 'seo', 'Статьи о поисковой оптимизации'),
  ('Руководства', 'guides', 'Пошаговые руководства'),
  ('Новости', 'news', 'Новости и обновления проекта')
ON CONFLICT (slug) DO NOTHING;

-- Комментарии к таблицам
COMMENT ON TABLE articles IS 'Таблица для хранения статей и FAQ';
COMMENT ON TABLE article_categories IS 'Категории статей';
COMMENT ON TABLE article_tags IS 'Теги для статей';
COMMENT ON TABLE article_tag_relations IS 'Связь между статьями и тегами (many-to-many)';

