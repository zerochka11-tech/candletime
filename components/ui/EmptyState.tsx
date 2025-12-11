import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string | ReactNode;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={`
        relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700
        bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800
        p-6 sm:p-8 md:p-10 text-center shadow-md transition-colors duration-200
        ${className || ''}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
      
      <div className="relative">
        <div className="mb-4 sm:mb-5 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 text-3xl sm:text-4xl shadow-sm">
          {typeof icon === 'string' ? icon : icon}
        </div>
        <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description && (
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-5 leading-relaxed px-2">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        )}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-slate-100 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white dark:text-slate-900 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-200 hover:shadow-lg active:scale-95 touch-manipulation min-h-[44px]"
          >
            {action.label}
          </Link>
        )}
      </div>
    </section>
  );
}

