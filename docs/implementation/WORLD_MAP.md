# 🌍 Карта мира со свечами - Детальный план реализации

**Дата создания:** Январь 2025  
**Версия:** 1.0  
**Проект:** CandleTime - Визуализация свечей на карте мира

---

## 📋 Содержание

1. [Обзор концепции](#обзор-концепции)
2. [Анализ требований](#анализ-требований)
3. [Технический стек](#технический-стек)
4. [Архитектура решения](#архитектура-решения)
5. [Изменения в базе данных](#изменения-в-базе-данных)
6. [Детальная реализация](#детальная-реализация)
7. [Компоненты и UI](#компоненты-и-ui)
8. [Приватность и безопасность](#приватность-и-безопасность)
9. [Производительность](#производительность)
10. [Пошаговая инструкция внедрения](#пошаговая-инструкция-внедрения)

---

## 🎯 Обзор концепции

### Цель
Создать красивую интерактивную карту мира, которая показывает, откуда пользователи зажигали свечи. Это визуализирует глобальную активность сообщества и создает эмоциональную связь с местами.

### Ключевые особенности
- ✅ **Интерактивная карта** - Leaflet.js с OpenStreetMap
- ✅ **Кластеризация маркеров** - для производительности при большом количестве свечей
- ✅ **Анонимизация данных** - приватность пользователей
- ✅ **Фильтры** - по типу свечи, дате, статусу
- ✅ **Статистика** - количество свечей по странам/городам
- ✅ **Красивый дизайн** - соответствует стилю CandleTime

### Примеры использования
- Видеть, откуда зажигают свечи поддержки во время событий
- Найти свечи памяти в определенном городе
- Понять глобальное распространение сервиса
- Эмоциональная связь с местами

---

## 🔍 Анализ требований

### Функциональные требования

#### 1. Отображение свечей на карте
- [ ] Показывать только активные свечи (или все по выбору)
- [ ] Кластеризация маркеров при зуме
- [ ] Разные иконки/цвета для разных типов свечей
- [ ] Popup с информацией о свече при клике

#### 2. Выбор локации при создании свечи
- [ ] Опциональное поле "Место" в форме создания
- [ ] Поиск места (город, страна, адрес)
- [ ] Автоматическое определение локации (опционально, с разрешения)
- [ ] Настройка приватности (показывать/скрывать на карте)

#### 3. Фильтры и навигация
- [ ] Фильтр по типу свечи
- [ ] Фильтр по статусу (активные/все)
- [ ] Фильтр по дате создания
- [ ] Поиск по стране/городу
- [ ] Переход к свече при клике на маркер

#### 4. Статистика
- [ ] Количество свечей по странам
- [ ] Количество свечей по городам
- [ ] Топ стран/городов
- [ ] Общее количество свечей на карте

### Нефункциональные требования

#### Производительность
- Загрузка карты < 2 секунд
- Плавная анимация при зуме/панорамировании
- Кластеризация для > 100 свечей
- Ленивая загрузка данных (пагинация)

#### Приватность
- Анонимизация координат (округление до ~10-50км)
- Опциональный показ на карте
- Никаких персональных данных в публичном API
- Согласие пользователя на геоданные

#### UX/UI
- Адаптивный дизайн (мобильная версия)
- Темная тема (dark mode)
- Плавные анимации
- Интуитивная навигация

---

## 🛠️ Технический стек

### Основные библиотеки

#### 1. Leaflet.js + React-Leaflet
**Почему Leaflet:**
- ✅ Легковесный (~38KB gzipped)
- ✅ Бесплатный (OpenStreetMap)
- ✅ Хорошая документация
- ✅ Активное сообщество
- ✅ Поддержка кластеризации

**Установка:**
```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

**Альтернативы:**
- Mapbox GL JS (более красивый, но требует API key)
- Google Maps (платный, более функциональный)

#### 2. Leaflet.markercluster
**Для кластеризации маркеров:**
```bash
npm install leaflet.markercluster
npm install --save-dev @types/leaflet.markercluster
```

#### 3. Nominatim (Geocoding)
**Для преобразования адресов в координаты:**
- Бесплатный API OpenStreetMap
- Не требует API key
- Rate limit: 1 запрос/сек (достаточно для нашего случая)

**Альтернативы:**
- Google Geocoding API (платный, но более точный)
- Mapbox Geocoding API (бесплатный тариф)

### Структура зависимостей

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "leaflet.markercluster": "^1.5.3"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/leaflet.markercluster": "^1.5.4"
  }
}
```

---

## 🏗️ Архитектура решения

### Структура компонентов

```
components/
  map/
    WorldMap.tsx              # Главный компонент карты
    MapMarker.tsx             # Маркер свечи на карте
    MapCluster.tsx            # Кластер маркеров
    MapControls.tsx           # Панель управления (фильтры, статистика)
    MapPopup.tsx              # Popup с информацией о свече
    MapLegend.tsx             # Легенда (типы свечей)
  geographic/
    LocationSelector.tsx      # Выбор места при создании свечи
    LocationDisplay.tsx       # Отображение места на странице свечи
    LocationStats.tsx         # Статистика по местам
```

### Поток данных

```
1. Пользователь создает свечу
   ↓
2. Опционально: выбирает место (через LocationSelector)
   ↓
3. Geocoding: адрес → координаты (через API)
   ↓
4. Анонимизация координат (округление)
   ↓
5. Сохранение в БД (candles table)
   ↓
6. Отображение на карте (WorldMap)
   ↓
7. Кластеризация при зуме (MapCluster)
   ↓
8. Popup при клике (MapPopup)
```

### API Endpoints

```
/api/geocode?q={query}              # Геокодинг (адрес → координаты)
/api/map/candles?bounds={...}       # Получение свечей для области карты
/api/map/stats                      # Статистика по странам/городам
```

---

## 💾 Изменения в базе данных

### 1. Обновление таблицы `candles`

```sql
-- Добавление полей для геолокации
ALTER TABLE candles
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('precise', 'city', 'country', 'region', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT,
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_anonymized_lat DECIMAL(10, 8), -- Округленные координаты для карты
ADD COLUMN IF NOT EXISTS location_anonymized_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_show_on_map BOOLEAN DEFAULT true, -- Показывать ли на публичной карте
ADD COLUMN IF NOT EXISTS location_address TEXT, -- Оригинальный адрес (для отображения пользователю)
ADD COLUMN IF NOT EXISTS location_timezone TEXT; -- Часовой пояс (для будущих фич)

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_candles_location_country ON candles(location_country) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_city ON candles(location_city) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_anonymized ON candles(location_anonymized_lat, location_anonymized_lng) WHERE location_show_on_map = true AND location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_show ON candles(location_show_on_map) WHERE location_show_on_map = true;

-- Комментарии
COMMENT ON COLUMN candles.location_type IS 'Тип локации: precise (точные координаты, приватно), city, country, region, none';
COMMENT ON COLUMN candles.location_anonymized_lat IS 'Округленные координаты для отображения на карте (приватность, ~10-50км точность)';
COMMENT ON COLUMN candles.location_anonymized_lng IS 'Округленные координаты для отображения на карте (приватность, ~10-50км точность)';
COMMENT ON COLUMN candles.location_show_on_map IS 'Показывать ли свечу на публичной карте';
```

### 2. Функция для анонимизации координат

```sql
-- Функция для округления координат (приватность)
-- precision_level: 1 = ~11км, 2 = ~1.1км (используем 1 для анонимности)
CREATE OR REPLACE FUNCTION anonymize_coordinates(
  lat DECIMAL,
  lng DECIMAL,
  precision_level INTEGER DEFAULT 1
) RETURNS TABLE(anonymized_lat DECIMAL, anonymized_lng DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(lat::numeric, precision_level)::DECIMAL,
    ROUND(lng::numeric, precision_level)::DECIMAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Триггер для автоматической анонимизации при вставке/обновлении
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

CREATE TRIGGER trigger_auto_anonymize_location
BEFORE INSERT OR UPDATE ON candles
FOR EACH ROW
WHEN (NEW.location_latitude IS NOT NULL AND NEW.location_longitude IS NOT NULL)
EXECUTE FUNCTION auto_anonymize_location();
```

### 3. Представление для карты (оптимизация)

```sql
-- Представление для быстрого получения свечей для карты
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

-- Индекс для быстрого поиска по границам карты
CREATE INDEX IF NOT EXISTS idx_map_candles_location ON candles USING GIST (
  POINT(location_anonymized_lng, location_anonymized_lat)
) WHERE location_show_on_map = true AND location_type != 'none';
```

### 4. RLS политики (без изменений, существующие политики работают)

---

## 💻 Детальная реализация

### 1. Геокодинг (API Route)

**Файл:** `app/api/geocode/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Геокодинг через Nominatim (OpenStreetMap)
 * Преобразует адрес/название места в координаты
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Nominatim API (бесплатный, OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CandleTime/1.0', // Требуется Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Преобразуем результаты в наш формат
    const results = data.map((item: any) => ({
      display_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country,
      city: item.address?.city || item.address?.town || item.address?.village,
      region: item.address?.state || item.address?.region,
      address: item.display_name,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    );
  }
}
```

### 2. API для получения свечей для карты

**Файл:** `app/api/map/candles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Получение свечей для отображения на карте
 * Поддерживает фильтрацию по границам карты (bounds)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bounds = searchParams.get('bounds'); // "minLat,minLng,maxLat,maxLng"
  const candleType = searchParams.get('type'); // Опциональный фильтр по типу
  const status = searchParams.get('status') || 'active'; // active, all

  try {
    let query = supabase
      .from('candles')
      .select('id, title, candle_type, created_at, expires_at, status, location_anonymized_lat, location_anonymized_lng, location_country, location_city')
      .eq('location_show_on_map', true)
      .neq('location_type', 'none')
      .not('location_anonymized_lat', 'is', null)
      .not('location_anonymized_lng', 'is', null);

    // Фильтр по статусу
    if (status === 'active') {
      const now = new Date().toISOString();
      query = query.gt('expires_at', now).eq('status', 'active');
    }

    // Фильтр по типу свечи
    if (candleType) {
      query = query.eq('candle_type', candleType);
    }

    // Фильтр по границам карты (если указаны)
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(parseFloat);
      query = query
        .gte('location_anonymized_lat', minLat)
        .lte('location_anonymized_lat', maxLat)
        .gte('location_anonymized_lng', minLng)
        .lte('location_anonymized_lng', maxLng);
    }

    const { data, error } = await query.limit(1000); // Лимит для производительности

    if (error) {
      throw error;
    }

    // Преобразуем в формат для карты
    const candles = (data || []).map((candle) => ({
      id: candle.id,
      title: candle.title,
      type: candle.candle_type,
      lat: parseFloat(candle.location_anonymized_lat),
      lng: parseFloat(candle.location_anonymized_lng),
      country: candle.location_country,
      city: candle.location_city,
      createdAt: candle.created_at,
      expiresAt: candle.expires_at,
      status: candle.status,
    }));

    return NextResponse.json({ candles });
  } catch (error) {
    console.error('Map candles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candles' },
      { status: 500 }
    );
  }
}
```

### 3. API для статистики

**Файл:** `app/api/map/stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Статистика по странам и городам
 */
export async function GET() {
  try {
    // Статистика по странам
    const { data: countryStats } = await supabase
      .from('candles')
      .select('location_country')
      .eq('location_show_on_map', true)
      .not('location_country', 'is', null);

    const countryCounts: Record<string, number> = {};
    countryStats?.forEach((candle) => {
      const country = candle.location_country;
      if (country) {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    });

    // Статистика по городам (топ 20)
    const { data: cityStats } = await supabase
      .from('candles')
      .select('location_city, location_country')
      .eq('location_show_on_map', true)
      .not('location_city', 'is', null)
      .limit(1000);

    const cityCounts: Record<string, { count: number; country: string }> = {};
    cityStats?.forEach((candle) => {
      const city = candle.location_city;
      const country = candle.location_country;
      if (city) {
        if (!cityCounts[city]) {
          cityCounts[city] = { count: 0, country: country || '' };
        }
        cityCounts[city].count++;
      }
    });

    // Топ городов
    const topCities = Object.entries(cityCounts)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Общее количество свечей на карте
    const { count: totalCount } = await supabase
      .from('candles')
      .select('id', { count: 'exact', head: true })
      .eq('location_show_on_map', true)
      .neq('location_type', 'none');

    return NextResponse.json({
      countries: countryCounts,
      topCities,
      totalCandles: totalCount || 0,
    });
  } catch (error) {
    console.error('Map stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Компоненты и UI

### 1. Главный компонент карты

**Файл:** `components/map/WorldMap.tsx`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import dynamic from 'next/dynamic';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

// Динамический импорт для SSR
const MapMarkers = dynamic(() => import('./MapMarkers').then(mod => ({ default: mod.MapMarkers })), {
  ssr: false,
});

interface Candle {
  id: string;
  title: string;
  type: string | null;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

export function WorldMap() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all' as string,
    status: 'active' as 'active' | 'all',
  });

  const loadCandles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') {
        params.set('type', filters.type);
      }
      params.set('status', filters.status);

      const response = await fetch(`/api/map/candles?${params}`);
      const data = await response.json();
      setCandles(data.candles || []);
    } catch (error) {
      console.error('Failed to load candles:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  return (
    <div className="relative h-[600px] w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-lg">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarkers candles={candles} />
      </MapContainer>

      {/* Панель управления */}
      <div className="absolute top-4 left-4 z-[1000]">
        <MapControls
          filters={filters}
          onFiltersChange={setFilters}
          loading={loading}
        />
      </div>

      {/* Легенда */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
}
```

### 2. Маркеры на карте

**Файл:** `components/map/MapMarkers.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapPopup } from './MapPopup';

// Исправление иконок Leaflet для Next.js
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon.src || icon,
  iconRetinaUrl: iconRetina.src || iconRetina,
  shadowUrl: iconShadow.src || iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Candle {
  id: string;
  title: string;
  type: string | null;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

interface MapMarkersProps {
  candles: Candle[];
}

// Иконки для разных типов свечей
const getCandleIcon = (type: string | null) => {
  const colors: Record<string, string> = {
    calm: '#0ea5e9', // sky
    support: '#10b981', // emerald
    memory: '#6366f1', // indigo
    gratitude: '#f59e0b', // amber
    focus: '#f43f5e', // rose
  };

  const color = colors[type || 'default'] || '#64748b';

  return L.divIcon({
    className: 'candle-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export function MapMarkers({ candles }: MapMarkersProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || candles.length === 0) return;

    // Создаем кластер группу
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
    });

    // Добавляем маркеры
    candles.forEach((candle) => {
      const marker = L.marker([candle.lat, candle.lng], {
        icon: getCandleIcon(candle.type),
      });

      // Popup с информацией
      const popupContent = MapPopup({ candle });
      marker.bindPopup(popupContent);

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [map, candles]);

  return null;
}
```

### 3. Popup для маркера

**Файл:** `components/map/MapPopup.tsx`

```typescript
import Link from 'next/link';

interface Candle {
  id: string;
  title: string;
  type: string | null;
  country?: string;
  city?: string;
}

export function MapPopup({ candle }: { candle: Candle }) {
  const typeLabels: Record<string, string> = {
    calm: 'Спокойствие',
    support: 'Поддержка',
    memory: 'Память',
    gratitude: 'Благодарность',
    focus: 'Фокус',
  };

  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
        {candle.title}
      </h3>
      {candle.type && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
          {typeLabels[candle.type] || candle.type}
        </p>
      )}
      {(candle.city || candle.country) && (
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
          📍 {[candle.city, candle.country].filter(Boolean).join(', ')}
        </p>
      )}
      <Link
        href={`/candle/${candle.id}`}
        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
      >
        Открыть свечу →
      </Link>
    </div>
  );
}
```

### 4. Панель управления (фильтры)

**Файл:** `components/map/MapControls.tsx`

```typescript
'use client';

interface MapControlsProps {
  filters: {
    type: string;
    status: 'active' | 'all';
  };
  onFiltersChange: (filters: { type: string; status: 'active' | 'all' }) => void;
  loading: boolean;
}

export function MapControls({ filters, onFiltersChange, loading }: MapControlsProps) {
  const types = [
    { value: 'all', label: 'Все типы' },
    { value: 'calm', label: 'Спокойствие' },
    { value: 'support', label: 'Поддержка' },
    { value: 'memory', label: 'Память' },
    { value: 'gratitude', label: 'Благодарность' },
    { value: 'focus', label: 'Фокус' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 space-y-3 min-w-[200px] border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Фильтры
      </h3>

      {/* Фильтр по типу */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Тип свечи
        </label>
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Фильтр по статусу */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Статус
        </label>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as 'active' | 'all' })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
        >
          <option value="active">Только активные</option>
          <option value="all">Все свечи</option>
        </select>
      </div>

      {loading && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Загрузка...
        </div>
      )}
    </div>
  );
}
```

### 5. Легенда

**Файл:** `components/map/MapLegend.tsx`

```typescript
'use client';

export function MapLegend() {
  const types = [
    { type: 'calm', label: 'Спокойствие', color: '#0ea5e9' },
    { type: 'support', label: 'Поддержка', color: '#10b981' },
    { type: 'memory', label: 'Память', color: '#6366f1' },
    { type: 'gratitude', label: 'Благодарность', color: '#f59e0b' },
    { type: 'focus', label: 'Фокус', color: '#f43f5e' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-3 border border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Типы свечей
      </h4>
      <div className="space-y-1.5">
        {types.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white dark:border-slate-700"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. Выбор места при создании свечи

**Файл:** `components/geographic/LocationSelector.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

interface LocationData {
  display_name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  region?: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: LocationData | null) => void;
  initialLocation?: LocationData;
  showOnMap?: boolean;
  onShowOnMapChange?: (show: boolean) => void;
}

export function LocationSelector({
  onLocationSelect,
  initialLocation,
  showOnMap = true,
  onShowOnMapChange,
}: LocationSelectorProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );

  useEffect(() => {
    onLocationSelect(selectedLocation);
  }, [selectedLocation, onLocationSelect]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setResults([]);
    setQuery(location.display_name);
  };

  const handleRemove = () => {
    setSelectedLocation(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
        Место (опционально)
      </label>

      {/* Поиск */}
      {!selectedLocation && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Город, страна или адрес..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="rounded-lg bg-slate-900 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSearching ? '...' : 'Найти'}
            </button>
          </div>

          {/* Результаты поиска */}
          {results.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-48 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {result.display_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Выбранное место */}
      {selectedLocation && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                📍 {selectedLocation.display_name}
              </p>
              {onShowOnMapChange && (
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOnMap}
                    onChange={(e) => onShowOnMapChange(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Показывать на карте
                  </span>
                </label>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔐 Приватность и безопасность

### Анонимизация координат

1. **Округление координат** - до 1 знака после запятой (~11км точность)
2. **Опциональный показ** - пользователь может скрыть свечу с карты
3. **Никаких персональных данных** - на карте только обобщенные точки
4. **Согласие пользователя** - явное согласие на добавление геоданных

### RLS политики

```sql
-- Пользователи видят только анонимизированные координаты других
-- Точные координаты доступны только создателю свечи
CREATE POLICY "Users see anonymized locations"
  ON candles FOR SELECT
  USING (
    location_type != 'precise' OR
    auth.uid() = user_id OR
    location_show_on_map = false
  );
```

---

## ⚡ Производительность

### Оптимизации

1. **Кластеризация маркеров** - Leaflet.markercluster для > 100 свечей
2. **Ленивая загрузка** - загрузка свечей только для видимой области карты
3. **Кэширование** - кэширование результатов геокодинга
4. **Индексы БД** - индексы на location_anonymized_lat/lng
5. **Лимит запросов** - максимум 1000 свечей за запрос

### Метрики

- Загрузка карты: < 2 секунд
- Плавная анимация: 60 FPS
- Время отклика API: < 500ms

---

## 📝 Пошаговая инструкция внедрения

### Шаг 1: Установка зависимостей

```bash
npm install leaflet react-leaflet leaflet.markercluster
npm install --save-dev @types/leaflet @types/leaflet.markercluster
```

### Шаг 2: Обновление БД

Выполнить SQL скрипт из раздела "Изменения в базе данных" в Supabase SQL Editor.

### Шаг 3: Создание API routes

Создать файлы:
- `app/api/geocode/route.ts`
- `app/api/map/candles/route.ts`
- `app/api/map/stats/route.ts`

### Шаг 4: Создание компонентов

Создать компоненты в `components/map/` и `components/geographic/`.

### Шаг 5: Интеграция в форму создания свечи

Добавить `LocationSelector` в `app/light/page.tsx`.

### Шаг 6: Создание страницы карты

Создать `app/map/page.tsx` с компонентом `WorldMap`.

### Шаг 7: Добавление ссылки в навигацию

Добавить ссылку "Карта" в `components/SiteHeader.tsx`.

### Шаг 8: Тестирование

- Тестирование геокодинга
- Тестирование отображения на карте
- Тестирование фильтров
- Тестирование приватности

---

## 🎨 Дизайн и стилизация

### Цветовая схема

- Использовать цвета типов свечей из `lib/constants.ts`
- Темная тема для dark mode
- Плавные анимации при hover

### Адаптивность

- Мобильная версия: полноэкранная карта
- Планшет: карта с боковой панелью
- Десктоп: карта с панелью управления

---

## 🚀 Будущие улучшения

1. **Тепловая карта** - визуализация плотности свечей
2. **Анимация** - анимация появления свечей
3. **Экспорт** - экспорт данных карты
4. **Статистика** - более детальная статистика по странам/городам
5. **События** - синхронные события в разных часовых поясах

---

**Последнее обновление:** Январь 2025

