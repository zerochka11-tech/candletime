import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-6 w-full border-t border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 py-2.5 shadow-inner transition-colors duration-200">
      <div className="relative mx-auto max-w-5xl px-4">
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-indigo-500/3 dark:from-amber-500/5 dark:to-indigo-500/5" />
        
        <div className="relative flex min-h-[2.5rem] flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 sm:text-xs">
              © {new Date().getFullYear()} CandleTime. Все права защищены.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/privacy"
              className="rounded-lg px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm sm:px-2.5 sm:py-1 sm:text-xs"
            >
              Политика конфиденциальности
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

