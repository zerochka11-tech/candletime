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

