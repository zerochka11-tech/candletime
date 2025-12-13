# 🌍 План реализации географических коллекций и мест

**Дата создания:** 2025  
**Версия:** 1.0  
**Проект:** CandleTime - географические коллекции свечей

---

## 📋 Содержание

1. [Обзор концепции](#обзор-концепции)
2. [Принципы приватности](#принципы-приватности)
3. [Технический стек](#технический-стек)
4. [Архитектура решения](#архитектура-решения)
5. [Изменения в базе данных](#изменения-в-базе-данных)
6. [Детальная реализация](#детальная-реализация)
7. [Компоненты и структура кода](#компоненты-и-структура-кода)
8. [Пошаговая инструкция внедрения](#пошаговая-инструкция-внедрения)
9. [Оптимизация и безопасность](#оптимизация-и-безопасность)

---

## 🎯 Обзор концепции

### Цель
Позволить пользователям привязывать свечи к географическим местам, создавая:
- Визуализацию активности на карте мира
- Коллекции свечей по городам/странам/событиям
- Статистику по местам (анонимную)
- Эмоциональную связь с местами

### Ключевые особенности
- **Анонимность по умолчанию** - только общие точки на карте, без персональных данных
- **Опциональность** - пользователь сам решает, добавлять ли место
- **Приватность** - детали показываются только по разрешению
- **Гибкость** - разные уровни точности (страна, город, координаты)

### Примеры использования
- Свеча памяти о городе, где жил близкий человек
- Свеча поддержки для страны/региона во время событий
- Свеча благодарности месту, где произошло важное событие
- Коллекция свечей для определенного события (например, "Свечи для Украины")

---

## 🔐 Принципы приватности

### Уровни детализации локации

1. **Точный (приватный)** - координаты (lat/lng), доступны только создателю
2. **Город** - только название города, показывается на карте
3. **Страна** - только название страны, анонимная точка
4. **Регион** - крупный регион (например, "Восточная Европа")
5. **Без места** - по умолчанию, никаких геоданных

### Правила отображения на карте

- **Анонимные точки** - только обобщенные координаты (округление до ~10-50км)
- **Агрегация** - несколько свечей в одном месте показываются как одна точка с числом
- **Без персональных данных** - никогда не показываем, кто создал свечу
- **Опциональный показ** - пользователь может скрыть свою свечу с карты

### Согласие пользователя

- Явное согласие на добавление геоданных
- Возможность удалить геоданные в любой момент
- Прозрачность использования данных

---

## 🛠️ Технический стек

### Основные технологии:
- **Leaflet.js** - интерактивные карты (легковесная альтернатива Google Maps)
- **OpenStreetMap** - бесплатные карты (или Mapbox для лучшего дизайна)
- **PostgreSQL/PostGIS** (опционально) - для геопространственных запросов в Supabase
- **Geocoding API** - преобразование адресов в координаты (Nominatim - бесплатно)

### Альтернативы:
- **Google Maps API** - платный, но более функциональный
- **Mapbox** - красивый дизайн, есть бесплатный тариф
- **Azure Maps** - альтернатива

### Зависимости для установки:
```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

Для использования Nominatim (геокодинг):
```bash
npm install node-geocoder
```

---

## 🏗️ Архитектура решения

### Структура компонентов:

```
components/
  geographic/
    LocationSelector.tsx        # Выбор места при создании свечи
    LocationDisplay.tsx         # Отображение места на странице свечи
    CandlesMap.tsx             # Интерактивная карта со свечами
    LocationCollection.tsx     # Коллекция свечей по месту
    LocationStats.tsx          # Статистика по месту
  maps/
    MapMarker.tsx              # Маркер на карте
    MapCluster.tsx             # Кластеризация маркеров
    HeatmapLayer.tsx           # Тепловая карта (опционально)
```

### Поток данных:

```
User selects location → Geocoding → Store in DB →
  └─ Display on candle page
  └─ Aggregate for map (anonymize)
  └─ Show in collections
  └─ Include in statistics
```

---

## 💾 Изменения в базе данных

### 1. Обновление таблицы candles

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
ADD COLUMN IF NOT EXISTS location_address TEXT; -- Оригинальный адрес (для отображения пользователю)

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_candles_location_country ON candles(location_country) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_city ON candles(location_city) WHERE location_type != 'none';
CREATE INDEX IF NOT EXISTS idx_candles_location_anonymized ON candles(location_anonymized_lat, location_anonymized_lng) WHERE location_show_on_map = true;

-- Комментарии
COMMENT ON COLUMN candles.location_type IS 'Тип локации: precise (точные координаты, приватно), city, country, region, none';
COMMENT ON COLUMN candles.location_anonymized_lat IS 'Округленные координаты для отображения на карте (приватность)';
COMMENT ON COLUMN candles.location_show_on_map IS 'Показывать ли свечу на публичной карте';
```

### 2. Таблица для коллекций мест (опционально)

```sql
-- Коллекции свечей по местам/событиям
CREATE TABLE IF NOT EXISTS location_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location_country TEXT,
  location_city TEXT,
  location_type TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT -- Изображение для коллекции (опционально)
);

-- Связь свечей с коллекциями (many-to-many)
CREATE TABLE IF NOT EXISTS candle_location_collections (
  candle_id UUID REFERENCES candles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES location_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (candle_id, collection_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_location_collections_country ON location_collections(location_country);
CREATE INDEX IF NOT EXISTS idx_location_collections_public ON location_collections(is_public) WHERE is_public = true;
```

### 3. Функция для анонимизации координат

```sql
-- Функция для округления координат (приватность)
CREATE OR REPLACE FUNCTION anonymize_coordinates(
  lat DECIMAL,
  lng DECIMAL,
  precision_level INTEGER DEFAULT 2 -- Уровень округления (2 = ~1км, 1 = ~10км)
) RETURNS TABLE(anonymized_lat DECIMAL, anonymized_lng DECIMAL) AS $$
BEGIN
  -- Округляем до precision_level знаков после запятой
  -- 1 знак ≈ 11км, 2 знака ≈ 1.1км
  RETURN QUERY
  SELECT
    ROUND(lat::numeric, precision_level)::DECIMAL,
    ROUND(lng::numeric, precision_level)::DECIMAL;
END;
$$ LANGUAGE plpgsql;
```

### 4. RLS политики

```sql
-- Пользователи могут видеть только свои точные координаты
CREATE POLICY "Users can see own precise location"
  ON candles FOR SELECT
  USING (
    auth.uid() = user_id OR
    location_type != 'precise' OR
    location_show_on_map = false
  );

-- Пользователи могут обновлять свои геоданные
CREATE POLICY "Users can update own location"
  ON candles FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 💻 Детальная реализация

### 1. Геокодинг (преобразование адреса в координаты)

```typescript
// lib/geocoding.ts
import NodeGeocoder from 'node-geocoder';

// Настройка для Nominatim (OpenStreetMap, бесплатно)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null,
});

export interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface GeocodeResult {
  location: LocationData;
  anonymized: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Преобразует адрес или название места в координаты
 */
export async function geocodeLocation(
  query: string,
  precisionLevel: number = 2
): Promise<GeocodeResult | null> {
  try {
    const results = await geocoder.geocode(query);

    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];
    const lat = result.latitude;
    const lng = result.longitude;

    if (!lat || !lng) {
      return null;
    }

    // Анонимизируем координаты для карты
    const anonymized = anonymizeCoordinates(lat, lng, precisionLevel);

    return {
      location: {
        country: result.country,
        city: result.city || result.administrativeLevels?.level1short,
        region: result.administrativeLevels?.level1long,
        latitude: lat,
        longitude: lng,
        address: result.formattedAddress,
      },
      anonymized,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Округляет координаты для анонимизации
 */
function anonymizeCoordinates(
  lat: number,
  lng: number,
  precisionLevel: number = 2
): { latitude: number; longitude: number } {
  const multiplier = Math.pow(10, precisionLevel);
  return {
    latitude: Math.round(lat * multiplier) / multiplier,
    longitude: Math.round(lng * multiplier) / multiplier,
  };
}

/**
 * Определяет тип локации на основе данных
 */
export function determineLocationType(
  location: LocationData
): 'precise' | 'city' | 'country' | 'region' | 'none' {
  if (location.latitude && location.longitude && location.city) {
    return 'precise';
  }
  if (location.city) {
    return 'city';
  }
  if (location.country) {
    return 'country';
  }
  if (location.region) {
    return 'region';
  }
  return 'none';
}
```

### 2. API Route для геокодинга

```typescript
// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  // Rate limiting (можно добавить)
  const result = await geocodeLocation(query);

  if (!result) {
    return NextResponse.json(
      { error: 'Location not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
```

---

## 🧩 Компоненты и структура кода

### 1. Компонент выбора локации

```typescript
// components/geographic/LocationSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationData } from '@/lib/geocoding';

interface LocationSelectorProps {
  onLocationSelect: (location: LocationData | null) => void;
  initialLocation?: LocationData;
  required?: boolean;
}

export function LocationSelector({
  onLocationSelect,
  initialLocation,
  required = false,
}: LocationSelectorProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [showOnMap, setShowOnMap] = useState(true);
  const [precisionLevel, setPrecisionLevel] = useState<1 | 2>(2);

  useEffect(() => {
    onLocationSelect(selectedLocation);
  }, [selectedLocation, onLocationSelect]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedLocation(result.location);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemove = () => {
    setSelectedLocation(null);
    setQuery('');
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Место (опционально)
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>

      {/* Поиск места */}
      {!selectedLocation && (
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Введите город, страну или адрес..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      )}

      {/* Выбранное место */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {selectedLocation.address || 
                   `${selectedLocation.city || ''}, ${selectedLocation.country || ''}`.trim() ||
                   'Выбранное место'}
                </p>
                {selectedLocation.city && (
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedLocation.city}
                    {selectedLocation.country && `, ${selectedLocation.country}`}
                  </p>
                )}
              </div>
              <button
                onClick={handleRemove}
                className="ml-2 text-slate-400 hover:text-slate-600"
                aria-label="Удалить место"
              >
                ✕
              </button>
            </div>

            {/* Настройки приватности */}
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showOnMap}
                  onChange={(e) => setShowOnMap(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span>Показывать на публичной карте</span>
              </label>

              <div className="text-sm text-slate-600">
                <label className="block mb-2">Точность отображения:</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precision"
                      value="2"
                      checked={precisionLevel === 2}
                      onChange={() => setPrecisionLevel(2)}
                      className="border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Город (~1км)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="precision"
                      value="1"
                      checked={precisionLevel === 1}
                      onChange={() => setPrecisionLevel(1)}
                      className="border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Регион (~10км)</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Более низкая точность лучше для приватности
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Информация о приватности */}
      <p className="text-xs text-slate-500">
        💡 Место будет показано на карте только с выбранной точностью. 
        Точные координаты видны только вам.
      </p>
    </div>
  );
}
```

### 2. Компонент карты со свечами

```typescript
// components/geographic/CandlesMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabaseClient';

// Фикс для иконок Leaflet в Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CandleLocation {
  id: string;
  title: string;
  candle_type: string;
  latitude: number;
  longitude: number;
  count?: number; // Количество свечей в этой точке (агрегация)
}

interface CandlesMapProps {
  height?: string;
  showControls?: boolean;
}

export function CandlesMap({ height = '400px', showControls = true }: CandlesMapProps) {
  const [candles, setCandles] = useState<CandleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    loadCandles();
  }, []);

  const loadCandles = async () => {
    try {
      // Загружаем только свечи, которые должны показываться на карте
      // Используем анонимизированные координаты
      const { data, error } = await supabase
        .from('candles')
        .select('id, title, candle_type, location_anonymized_lat, location_anonymized_lng')
        .eq('location_show_on_map', true)
        .not('location_anonymized_lat', 'is', null)
        .not('location_anonymized_lng', 'is', null)
        .eq('status', 'active')
        .limit(1000); // Лимит для производительности

      if (error) throw error;

      // Агрегируем свечи по координатам (группировка близких точек)
      const aggregated = aggregateCandles(data || []);

      setCandles(aggregated);
    } catch (error) {
      console.error('Error loading candles for map:', error);
    } finally {
      setLoading(false);
    }
  };

  // Агрегация близких точек
  const aggregateCandles = (
    candles: Array<{
      id: string;
      title: string;
      candle_type: string;
      location_anonymized_lat: number;
      location_anonymized_lng: number;
    }>
  ): CandleLocation[] => {
    const clusters = new Map<string, CandleLocation[]>();
    const clusterRadius = 0.01; // ~1км

    candles.forEach((candle) => {
      if (!candle.location_anonymized_lat || !candle.location_anonymized_lng) return;

      // Находим ближайший кластер
      let found = false;
      for (const [key, cluster] of clusters.entries()) {
        const [lat, lng] = key.split(',').map(Number);
        const distance = Math.sqrt(
          Math.pow(lat - candle.location_anonymized_lat, 2) +
          Math.pow(lng - candle.location_anonymized_lng, 2)
        );

        if (distance < clusterRadius) {
          cluster.push({
            id: candle.id,
            title: candle.title,
            candle_type: candle.candle_type,
            latitude: candle.location_anonymized_lat,
            longitude: candle.location_anonymized_lng,
          });
          found = true;
          break;
        }
      }

      if (!found) {
        const key = `${candle.location_anonymized_lat},${candle.location_anonymized_lng}`;
        clusters.set(key, [
          {
            id: candle.id,
            title: candle.title,
            candle_type: candle.candle_type,
            latitude: candle.location_anonymized_lat,
            longitude: candle.location_anonymized_lng,
          },
        ]);
      }
    });

    // Преобразуем кластеры в точки с количеством
    const result: CandleLocation[] = [];
    clusters.forEach((cluster) => {
      if (cluster.length === 1) {
        result.push(cluster[0]);
      } else {
        // Средние координаты и сумма
        const avgLat =
          cluster.reduce((sum, c) => sum + c.latitude, 0) / cluster.length;
        const avgLng =
          cluster.reduce((sum, c) => sum + c.longitude, 0) / cluster.length;

        result.push({
          id: cluster[0].id,
          title: `${cluster.length} свечей`,
          candle_type: cluster[0].candle_type,
          latitude: avgLat,
          longitude: avgLng,
          count: cluster.length,
        });
      }
    });

    return result;
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-600">Загрузка карты...</p>
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-600">Пока нет свечей на карте</p>
      </div>
    );
  }

  // Определяем границы карты
  const defaultBounds = L.latLngBounds(
    candles.map((c) => [c.latitude, c.longitude])
  );

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-200" style={{ height }}>
      <MapContainer
        center={[defaultBounds.getCenter().lat, defaultBounds.getCenter().lng]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {candles.map((candle) => (
          <Marker
            key={candle.id}
            position={[candle.latitude, candle.longitude]}
            icon={L.divIcon({
              html: getCandleIcon(candle.candle_type, candle.count),
              className: 'custom-marker',
              iconSize: [30, 30],
            })}
          >
            <Popup>
              <div className="p-2">
                <p className="font-medium">{candle.title}</p>
                {candle.count && (
                  <p className="text-sm text-slate-600">{candle.count} свечей здесь</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// Иконка свечи по типу
function getCandleIcon(candleType: string, count?: number): string {
  const emojiMap: Record<string, string> = {
    calm: '🕊️',
    support: '🤝',
    memory: '🌙',
    gratitude: '✨',
    focus: '🎯',
  };

  const emoji = emojiMap[candleType] || '🕯️';

  if (count && count > 1) {
    return `
      <div style="
        background: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-size: 16px;
        position: relative;
      ">
        ${emoji}
        <span style="
          position: absolute;
          bottom: -5px;
          right: -5px;
          background: #f59e0b;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        ">${count}</span>
      </div>
    `;
  }

  return `
    <div style="
      background: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      font-size: 16px;
    ">
      ${emoji}
    </div>
  `;
}
```

### 3. Компонент отображения места на странице свечи

```typescript
// components/geographic/LocationDisplay.tsx
'use client';

import Link from 'next/link';
import { LocationData } from '@/lib/geocoding';

interface LocationDisplayProps {
  location: LocationData;
  candleId?: string;
  showLink?: boolean;
}

export function LocationDisplay({
  location,
  candleId,
  showLink = true,
}: LocationDisplayProps) {
  const locationText = [
    location.city,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  if (!locationText) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span>📍</span>
      {showLink && candleId ? (
        <Link
          href={`/locations?country=${location.country}&city=${location.city}`}
          className="hover:text-amber-600 underline"
        >
          {locationText}
        </Link>
      ) : (
        <span>{locationText}</span>
      )}
    </div>
  );
}
```

### 4. Компонент коллекции по месту

```typescript
// components/geographic/LocationCollection.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface LocationCollectionProps {
  country?: string;
  city?: string;
  region?: string;
}

export function LocationCollection({
  country,
  city,
  region,
}: LocationCollectionProps) {
  const [candles, setCandles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandles();
  }, [country, city, region]);

  const loadCandles = async () => {
    try {
      let query = supabase
        .from('candles')
        .select('id, title, message, candle_type, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (country) {
        query = query.eq('location_country', country);
      }
      if (city) {
        query = query.eq('location_city', city);
      }
      if (region) {
        query = query.eq('location_region', region);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCandles(data || []);
    } catch (error) {
      console.error('Error loading location collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const locationName = [city, country].filter(Boolean).join(', ') || region;

  if (loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Свечи: {locationName}
        </h2>
        <p className="text-slate-600 mt-1">
          {candles.length} {candles.length === 1 ? 'свеча' : 'свечей'}
        </p>
      </div>

      {candles.length === 0 ? (
        <p className="text-slate-600">Пока нет свечей для этого места</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candles.map((candle) => (
            <Link
              key={candle.id}
              href={`/candle/${candle.id}`}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <h3 className="font-medium text-slate-900">{candle.title}</h3>
              {candle.message && (
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                  {candle.message}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Пошаговая инструкция внедрения

### Шаг 1: Установка зависимостей

```bash
npm install leaflet react-leaflet node-geocoder
npm install --save-dev @types/leaflet
```

### Шаг 2: Обновление базы данных

1. Выполнить SQL скрипты из раздела "Изменения в базе данных"
2. Проверить индексы
3. Протестировать функцию анонимизации

### Шаг 3: Создание утилит

1. Создать `lib/geocoding.ts` с функциями геокодинга
2. Создать API route `app/api/geocode/route.ts`

### Шаг 4: Создание компонентов

1. Создать `components/geographic/LocationSelector.tsx`
2. Создать `components/geographic/CandlesMap.tsx`
3. Создать `components/geographic/LocationDisplay.tsx`
4. Создать `components/geographic/LocationCollection.tsx`

### Шаг 5: Интеграция в страницу создания свечи

```typescript
// app/[locale]/light/page.tsx
import { LocationSelector } from '@/components/geographic/LocationSelector';

// В форме создания свечи:
const [location, setLocation] = useState<LocationData | null>(null);

// В JSX:
<LocationSelector
  onLocationSelect={setLocation}
  required={false}
/>

// При сохранении свечи:
const candleData = {
  // ... другие поля
  location_type: location ? determineLocationType(location) : 'none',
  location_country: location?.country || null,
  location_city: location?.city || null,
  location_region: location?.region || null,
  location_latitude: location?.latitude || null,
  location_longitude: location?.longitude || null,
  location_anonymized_lat: location ? anonymizeCoordinates(location.latitude!, location.longitude!).latitude : null,
  location_anonymized_lng: location ? anonymizeCoordinates(location.latitude!, location.longitude!).longitude : null,
  location_show_on_map: showOnMap,
  location_address: location?.address || null,
};
```

### Шаг 6: Интеграция карты

```typescript
// app/[locale]/locations/page.tsx - новая страница
import { CandlesMap } from '@/components/geographic/CandlesMap';

export default function LocationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Карта свечей</h1>
      <CandlesMap height="600px" />
    </div>
  );
}
```

### Шаг 7: Отображение места на странице свечи

```typescript
// app/[locale]/candle/[id]/page.tsx
import { LocationDisplay } from '@/components/geographic/LocationDisplay';

// В компоненте:
{candle.location_city && (
  <LocationDisplay
    location={{
      city: candle.location_city,
      country: candle.location_country,
    }}
    candleId={candle.id}
    showLink={true}
  />
)}
```

---

## 🔒 Оптимизация и безопасность

### 1. Rate Limiting для геокодинга

```typescript
// lib/rateLimiter.ts
const geocodeRequests = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 минута
  const maxRequests = 10;

  const requests = geocodeRequests.get(ip) || [];
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  geocodeRequests.set(ip, recentRequests);

  // Очистка старых записей
  setTimeout(() => {
    geocodeRequests.delete(ip);
  }, windowMs * 2);

  return true;
}
```

### 2. Кэширование результатов геокодинга

```typescript
// lib/geocoding.ts
const geocodeCache = new Map<string, GeocodeResult>();

export async function geocodeLocationCached(
  query: string,
  precisionLevel: number = 2
): Promise<GeocodeResult | null> {
  const cacheKey = `${query}:${precisionLevel}`;
  
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const result = await geocodeLocation(query, precisionLevel);
  if (result) {
    geocodeCache.set(cacheKey, result);
    // Очистка кэша через час
    setTimeout(() => geocodeCache.delete(cacheKey), 3600000);
  }

  return result;
}
```

### 3. Оптимизация запросов к карте

```typescript
// Использовать виртуализацию для больших списков
// Загружать свечи по регионам (lazy loading)
// Использовать кластеризацию маркеров (leaflet.markercluster)
```

### 4. Валидация данных

```typescript
// lib/validation.ts
export function validateLocation(location: LocationData): boolean {
  if (!location.latitude || !location.longitude) return false;
  
  // Проверка диапазонов координат
  if (location.latitude < -90 || location.latitude > 90) return false;
  if (location.longitude < -180 || location.longitude > 180) return false;
  
  return true;
}
```

---

## 🧪 Тестирование

### 1. Тесты геокодинга

```typescript
// __tests__/geocoding.test.ts
import { geocodeLocation } from '@/lib/geocoding';

describe('Geocoding', () => {
  it('should geocode Moscow correctly', async () => {
    const result = await geocodeLocation('Moscow, Russia');
    expect(result?.location.city).toBe('Moscow');
    expect(result?.location.country).toBe('Russia');
    expect(result?.location.latitude).toBeDefined();
  });

  it('should anonymize coordinates', () => {
    // Тесты анонимизации
  });
});
```

### 2. Тесты компонентов

```typescript
// __tests__/LocationSelector.test.tsx
import { render, screen } from '@testing-library/react';
import { LocationSelector } from '@/components/geographic/LocationSelector';

describe('LocationSelector', () => {
  it('renders search input', () => {
    render(<LocationSelector onLocationSelect={() => {}} />);
    expect(screen.getByPlaceholderText(/город/i)).toBeInTheDocument();
  });
});
```

---

## 📊 Метрики успеха

### Технические метрики:
- ✅ Время геокодинга < 2 секунд
- ✅ Загрузка карты < 3 секунд
- ✅ FPS на карте > 30
- ✅ Работает на мобильных устройствах

### Пользовательские метрики:
- ✅ Adoption rate > 15% (пользователи добавляют места)
- ✅ Положительные отзывы о приватности
- ✅ Увеличение engagement на странице карты
- ✅ Создание коллекций по местам

---

## 🚀 План внедрения по фазам

### Фаза 1: Базовая функциональность (1-2 недели)
1. Обновление БД
2. Геокодинг API
3. Выбор места при создании свечи
4. Сохранение в БД

### Фаза 2: Карта и визуализация (1 неделя)
1. Интеграция Leaflet
2. Компонент карты
3. Отображение свечей
4. Страница с картой

### Фаза 3: Коллекции и статистика (1 неделя)
1. Компонент коллекций
2. Страница коллекций
3. Статистика по местам
4. Оптимизация

### Фаза 4: Полировка (3-5 дней)
1. Тестирование
2. Оптимизация производительности
3. Документация
4. Улучшения UX

---

**Последнее обновление:** 2025  
**Версия документа:** 1.0  
**Статус:** Готов к реализации
