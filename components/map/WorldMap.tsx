'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { MapControls } from './MapControls';

// Определяем тему карты на основе dark mode
function getMapTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Динамический импорт для SSR (Leaflet не работает на сервере)
const MapMarkers = dynamic(
  () => import('./MapMarkers').then((mod) => ({ default: mod.MapMarkers })),
  {
    ssr: false,
  }
);

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
  // Инициализируем тему только на клиенте
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [panelVisible, setPanelVisible] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all' as string,
    status: 'active' as 'active' | 'all',
  });

  // Инициализируем тему и отслеживаем изменение темы только на клиенте
  useEffect(() => {
    // Устанавливаем начальную тему
    setMapTheme(getMapTheme());

    // Отслеживаем изменение темы
    const observer = new MutationObserver(() => {
      setMapTheme(getMapTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="z-0"
        scrollWheelZoom={true}
      >
        {/* Mapbox (требует NEXT_PUBLIC_MAPBOX_TOKEN) */}
        {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/${mapTheme === 'dark' ? 'dark-v11' : 'light-v11'}/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            tileSize={256}
            zoomOffset={-1}
          />
        ) : (
          // CartoDB (бесплатно, без регистрации) - автоматически переключается между светлой и темной темой
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={`https://{s}.basemaps.cartocdn.com/${mapTheme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
            subdomains="abcd"
          />
        )}
        <MapMarkers candles={candles} />
      </MapContainer>

      {/* Правая панель: кнопка, счетчик и фильтры */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] flex flex-col gap-2">
        {/* Кнопка показа/скрытия панели */}
        <button
          type="button"
          onClick={() => setPanelVisible(!panelVisible)}
          className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-md px-2.5 py-1.5 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title={panelVisible ? 'Скрыть панель управления' : 'Показать панель управления'}
        >
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {panelVisible ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Скрыть
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Показать
              </>
            )}
          </span>
        </button>

        {/* Счетчик свечей и фильтры (скрываются вместе) */}
        {panelVisible && (
          <>
            {/* Счетчик свечей */}
            {!loading && (
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {candles.length} {candles.length === 1 ? 'свеча' : candles.length < 5 ? 'свечи' : 'свечей'}
                </p>
              </div>
            )}

            {/* Фильтры */}
            <MapControls
              filters={filters}
              onFiltersChange={setFilters}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}

