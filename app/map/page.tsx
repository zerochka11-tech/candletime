'use client';

import { WorldMap } from '@/components/map/WorldMap';

// Отключаем статическую генерацию, так как карта требует клиентского рендеринга
export const dynamic = 'force-dynamic';

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

