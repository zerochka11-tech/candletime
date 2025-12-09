'use client';

import dynamic from 'next/dynamic';

// Динамический импорт с отключением SSR, так как Leaflet использует window
const WorldMap = dynamic(
  () => import('@/components/map/WorldMap').then((mod) => ({ default: mod.WorldMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-2xl border border-slate-300 dark:border-slate-700 shadow-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-slate-400 mx-auto"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Загрузка карты...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
          Карта свечей
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 md:text-base">
          Посмотрите, откуда пользователи зажигают свечи по всему миру
        </p>
      </header>

      <WorldMap />
    </div>
  );
}

