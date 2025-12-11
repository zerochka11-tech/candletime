'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Динамический импорт с отключением SSR, так как Leaflet использует window
const WorldMap = dynamic(
  () => import('@/components/map/WorldMap').then((mod) => ({ default: mod.WorldMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-slate-400 mx-auto"></div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Загрузка карты...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Заголовок + Кнопка */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 p-3 shadow-md sm:p-4 md:p-5 transition-colors duration-200">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
        
        <div className="relative space-y-3 sm:space-y-4">
          {/* Заголовок */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-base sm:text-lg shadow-sm">
              🗺️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl md:text-2xl truncate">
                Карта свечей
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                Посмотрите, откуда пользователи зажигают свечи по всему миру
              </p>
            </div>
          </div>

          {/* Кнопка "Зажечь свечу на карте" */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/light"
              className="group inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 hover:shadow-md active:scale-[0.98] sm:gap-2 sm:px-5 sm:text-sm min-h-[44px] touch-manipulation"
            >
              <span className="text-sm sm:text-base transition-transform duration-200 group-hover:scale-110">🕯️</span>
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">Зажечь свечу на карте</span>
                <span className="sm:hidden">Зажечь свечу</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Карта */}
      <div className="rounded-2xl border border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="w-full h-[400px] sm:h-[450px] md:h-[500px]">
          <WorldMap />
        </div>
      </div>
    </div>
  );
}

