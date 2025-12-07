-- ============================================
-- SQL скрипт для настройки базы данных CandleTime
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- Создание таблицы candles
CREATE TABLE IF NOT EXISTS candles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  candle_type TEXT,
  duration_hours INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_candles_expires_at ON candles(expires_at);
CREATE INDEX IF NOT EXISTS idx_candles_user_id ON candles(user_id);
CREATE INDEX IF NOT EXISTS idx_candles_created_at ON candles(created_at);
CREATE INDEX IF NOT EXISTS idx_candles_status ON candles(status);
CREATE INDEX IF NOT EXISTS idx_candles_candle_type ON candles(candle_type);

-- Включение Row Level Security (RLS)
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать все свечи (публичный доступ)
CREATE POLICY "Anyone can read candles"
  ON candles FOR SELECT
  USING (true);

-- Политика: все могут создавать свечи (включая анонимных пользователей)
CREATE POLICY "Anyone can create candles"
  ON candles FOR INSERT
  WITH CHECK (true);

-- Политика: только владелец может обновлять свою свечу
CREATE POLICY "Users can update own candles"
  ON candles FOR UPDATE
  USING (auth.uid() = user_id);

-- Политика: только владелец может удалять свою свечу
CREATE POLICY "Users can delete own candles"
  ON candles FOR DELETE
  USING (auth.uid() = user_id);

-- Комментарии к таблице и полям (опционально)
COMMENT ON TABLE candles IS 'Таблица для хранения символических свечей';
COMMENT ON COLUMN candles.title IS 'Название свечи';
COMMENT ON COLUMN candles.message IS 'Сообщение к свече (опционально)';
COMMENT ON COLUMN candles.expires_at IS 'Время, когда свеча погаснет';
COMMENT ON COLUMN candles.status IS 'Статус свечи: active, expired, extinguished';
COMMENT ON COLUMN candles.is_anonymous IS 'Анонимная ли свеча';
COMMENT ON COLUMN candles.candle_type IS 'Тип свечи: calm, support, memory, gratitude, focus';
COMMENT ON COLUMN candles.user_id IS 'ID пользователя, создавшего свечу (null для анонимных)';

