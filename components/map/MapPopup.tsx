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
    <div className="p-2 sm:p-3 min-w-[160px] sm:min-w-[200px] max-w-[240px] sm:max-w-[280px]">
      <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
        {candle.title}
      </h3>
      {candle.type && (
        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">
          {typeLabels[candle.type] || candle.type}
        </p>
      )}
      {(candle.city || candle.country) && (
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mb-1.5 sm:mb-2 line-clamp-1">
          📍 {[candle.city, candle.country].filter(Boolean).join(', ')}
        </p>
      )}
      <Link
        href={`/candle/${candle.id}`}
        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 hover:underline touch-manipulation"
      >
        <span>Открыть свечу</span>
        <span className="hidden sm:inline">→</span>
      </Link>
    </div>
  );
}

