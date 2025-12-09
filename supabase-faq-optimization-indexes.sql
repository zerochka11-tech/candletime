-- ============================================
-- SQL скрипт для оптимизации индексов FAQ/Статей
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Оптимизированные индексы для быстрых запросов

-- 1. Индекс для сортировки по дате публикации (самый частый запрос)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc ON articles(published_at DESC) WHERE published = true AND published_at IS NOT NULL;

-- 2. Композитный индекс для фильтрации по категории и статусу
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category_id, published, published_at DESC) WHERE published = true AND published_at IS NOT NULL;

-- 3. Индекс для сортировки по популярности (views_count)
CREATE INDEX IF NOT EXISTS idx_articles_views_desc ON articles(views_count DESC) WHERE published = true;

-- 4. Индекс для сортировки по времени чтения
CREATE INDEX IF NOT EXISTS idx_articles_reading_time ON articles(reading_time) WHERE published = true;

-- 5. Индекс для поиска по slug (уже должен быть, но проверим)
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug) WHERE published = true;

-- 6. Индекс для навигации (prev/next по дате в категории)
CREATE INDEX IF NOT EXISTS idx_articles_category_date_nav ON articles(category_id, published_at DESC) WHERE published = true AND published_at IS NOT NULL;

-- 7. Индекс для admin панели (фильтрация по published)
CREATE INDEX IF NOT EXISTS idx_articles_published_created ON articles(published, created_at DESC);

-- Проверка существующих индексов (раскомментируй для проверки)
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'articles' ORDER BY indexname;
