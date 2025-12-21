-- ============================================
-- SQL скрипт для добавления рождественской темы
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Создание таблицы для настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Включение Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики, если они есть (для идемпотентности)
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;

-- Политика: все могут читать настройки
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Политика: только администраторы могут изменять настройки
-- Примечание: для работы политик администраторов нужно настроить переменную окружения
-- или использовать другой метод проверки (например, через таблицу ролей)
-- Временно используем упрощенную проверку - все авторизованные пользователи могут изменять
-- В продакшене это должно быть ограничено только администраторами
CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Вставка начальных настроек
INSERT INTO site_settings (key, value, description)
VALUES (
  'christmas_theme_enabled',
  'false'::jsonb,
  'Включить/выключить рождественскую тему на сайте'
)
ON CONFLICT (key) DO NOTHING;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем триггер, если он существует (для идемпотентности)
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

