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
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setQuery(initialLocation.display_name);
    }
  }, [initialLocation]);

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
      setResults([]);
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
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="rounded-xl bg-slate-900 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-slate-800 dark:hover:bg-slate-600"
            >
              {isSearching ? '...' : 'Найти'}
            </button>
          </div>

          {/* Результаты поиска */}
          {results.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-48 overflow-y-auto shadow-md">
              {results.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition"
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
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                📍 {selectedLocation.display_name}
              </p>
              {onShowOnMapChange && (
                <label className="mt-2 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnMap}
                    onChange={(e) => onShowOnMapChange(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500"
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
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition ml-2"
              aria-label="Удалить место"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

