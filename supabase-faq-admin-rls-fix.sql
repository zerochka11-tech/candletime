-- ============================================
-- SQL скрипт для исправления RLS политик для админов
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Создаем функцию для проверки, является ли пользователь админом
-- Эта функция проверяет email пользователя против списка админов из переменной окружения
-- В Supabase можно использовать функцию для проверки email
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Проверяем, авторизован ли пользователь
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Получаем email текущего пользователя
  DECLARE
    user_email TEXT;
  BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Список админов (нужно обновить в соответствии с NEXT_PUBLIC_ADMIN_EMAILS)
    -- ВАЖНО: В реальном проекте лучше хранить это в отдельной таблице или использовать
    -- переменные окружения через Supabase Edge Functions
    RETURN user_email IN (
      'admin@example.com',  -- Замените на реальные email админов
      'your-admin@example.com'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Альтернативный вариант: создаем таблицу для хранения админов
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- RLS для таблицы админов (только админы могут читать)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Политика: только админы могут читать список админов
-- (это циклическая зависимость, поэтому используем SECURITY DEFINER функцию)
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  USING (is_admin_user());

-- Обновленная функция для проверки админа через таблицу
CREATE OR REPLACE FUNCTION is_admin_user_v2()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Добавляем политику для админов: они могут читать все статьи (включая неопубликованные)
-- Это позволит админам видеть все статьи на странице /faq
CREATE POLICY "Admins can read all articles"
  ON articles FOR SELECT
  USING (
    -- Обычные пользователи видят только опубликованные
    (published = true AND published_at IS NOT NULL AND published_at <= NOW())
    OR
    -- Админы видят все статьи
    is_admin_user_v2()
  );

-- Комментарий: если вы используете переменные окружения через Edge Functions,
-- можно создать функцию, которая проверяет email через API

-- Пример: добавление админа в таблицу
-- INSERT INTO admin_users (user_id, email)
-- SELECT id, email
-- FROM auth.users
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Проверка: посмотрим текущие политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY policyname;

