import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Админ-панель: Управление статьями | CandleTime',
  description: 'Управление SEO-статьями для CandleTime',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Админ-панель: Статьи
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Управление SEO-статьями и их публикацией
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            ← Назад к списку
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

