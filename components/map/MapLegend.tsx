'use client';

import { CANDLE_TYPES } from '@/lib/constants';

interface MapLegendProps {
  candles: Array<{ type: string | null }>;
  activeFilter?: string;
  onTypeClick?: (type: string) => void;
  isVisible: boolean;
}

export function MapLegend({ candles, activeFilter, onTypeClick, isVisible }: MapLegendProps) {
  // Подсчитываем количество свечей каждого типа
  const typeCounts = candles.reduce((acc, candle) => {
    const type = candle.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Фильтруем только типы, которые есть на карте, и сортируем по количеству
  const sortedTypes = [...CANDLE_TYPES]
    .filter((type) => (typeCounts[type.id] || 0) > 0)
    .sort((a, b) => {
      const countA = typeCounts[a.id] || 0;
      const countB = typeCounts[b.id] || 0;
      return countB - countA;
    });

  const handleTypeClick = (type: string) => {
    if (onTypeClick) {
      if (activeFilter === type) {
        onTypeClick('all');
      } else {
        onTypeClick(type);
      }
    }
  };

  // Цвета из MapMarkers
  const colorMap: Record<string, string> = {
    calm: '#0ea5e9',
    support: '#10b981',
    memory: '#6366f1',
    gratitude: '#f59e0b',
    focus: '#f43f5e',
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex flex-col gap-1.5">
        {sortedTypes.map((type) => {
          const count = typeCounts[type.id] || 0;
          const isActive = activeFilter === type.id;
          const color = colorMap[type.id] || '#64748b';

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeClick(type.id)}
              className={`
                flex items-center gap-1.5 px-1.5 py-1 rounded transition-all duration-150
                ${isActive
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
              `}
              title={type.label}
            >
              {/* Цветной индикатор */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: color,
                  opacity: isActive ? 1 : 0.7,
                }}
              />
              {/* Эмодзи */}
              <span className="text-xs">{type.emoji}</span>
              {/* Счетчик (только если больше 1) */}
              {count > 1 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

