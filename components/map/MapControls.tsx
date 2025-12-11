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
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-md p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 w-[140px] sm:min-w-[160px] border border-slate-200/50 dark:border-slate-700/50">
      {/* Фильтр по типу */}
      <div>
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 touch-manipulation"
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
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as 'active' | 'all' })}
          className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 touch-manipulation"
        >
          <option value="active">Только активные</option>
          <option value="all">Все свечи</option>
        </select>
      </div>

      {loading && (
        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center">
          Загрузка...
        </div>
      )}
    </div>
  );
}

