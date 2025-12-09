-- ============================================
-- SQL скрипт для добавления поддержки карты мира
-- Выполни этот скрипт в Supabase SQL Editor
-- ============================================

-- 1. Добавление полей для геолокации в таблицу candles
ALTER TABLE candles
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('precise', 'city', 'country', 'region', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT,
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_anonymized_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_anonymized_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_show_on_map BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_timezone TEXT;

-- 2. Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_candles_location_country ON candles(location_country) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_city ON candles(location_city) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_anonymized ON candles(location_anonymized_lat, location_anonymized_lng) WHERE location_show_on_map = true AND location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_show ON candles(location_show_on_map) WHERE location_show_on_map = true;

-- 3. Комментарии к полям
COMMENT ON COLUMN candles.location_type IS 'Тип локации: precise (точные координаты, приватно), city, country, region, none';
COMMENT ON COLUMN candles.location_anonymized_lat IS 'Округленные координаты для отображения на карте (приватность, ~10-50км точность)';
COMMENT ON COLUMN candles.location_anonymized_lng IS 'Округленные координаты для отображения на карте (приватность, ~10-50км точность)';
COMMENT ON COLUMN candles.location_show_on_map IS 'Показывать ли свечу на публичной карте';
COMMENT ON COLUMN candles.location_timezone IS 'Часовой пояс (для будущих фич)';

-- 4. Функция для анонимизации координат
CREATE OR REPLACE FUNCTION anonymize_coordinates(
  lat DECIMAL,
  lng DECIMAL,
  precision_level INTEGER DEFAULT 1
) RETURNS TABLE(anonymized_lat DECIMAL, anonymized_lng DECIMAL) AS $$
BEGIN
  -- precision_level: 1 = ~11км, 2 = ~1.1км
  -- Используем 1 для анонимности (~11км точность)
  RETURN QUERY
  SELECT
    ROUND(lat::numeric, precision_level)::DECIMAL,
    ROUND(lng::numeric, precision_level)::DECIMAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Триггер для автоматической анонимизации при вставке/обновлении
CREATE OR REPLACE FUNCTION auto_anonymize_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Если есть точные координаты, анонимизируем их
  IF NEW.location_latitude IS NOT NULL AND NEW.location_longitude IS NOT NULL THEN
    SELECT anonymized_lat, anonymized_lng
    INTO NEW.location_anonymized_lat, NEW.location_anonymized_lng
    FROM anonymize_coordinates(NEW.location_latitude, NEW.location_longitude, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем триггер, если он уже существует
DROP TRIGGER IF EXISTS trigger_auto_anonymize_location ON candles;

-- Создаем триггер
CREATE TRIGGER trigger_auto_anonymize_location
BEFORE INSERT OR UPDATE ON candles
FOR EACH ROW
WHEN (NEW.location_latitude IS NOT NULL AND NEW.location_longitude IS NOT NULL)
EXECUTE FUNCTION auto_anonymize_location();

-- 6. Представление для быстрого получения свечей для карты
CREATE OR REPLACE VIEW map_candles AS
SELECT
  id,
  title,
  candle_type,
  created_at,
  expires_at,
  status,
  location_anonymized_lat AS lat,
  location_anonymized_lng AS lng,
  location_country,
  location_city,
  location_type
FROM candles
WHERE location_show_on_map = true
  AND location_type != 'none'
  AND location_anonymized_lat IS NOT NULL
  AND location_anonymized_lng IS NOT NULL;

-- 7. Обновление RLS политик (если нужно)
-- Существующие политики должны работать, но можно добавить проверку на location_show_on_map
-- Это не критично, так как мы фильтруем в запросах

-- Готово! Теперь можно использовать геолокацию для свечей.

