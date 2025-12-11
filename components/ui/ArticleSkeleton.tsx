import { Skeleton, TextSkeleton } from './Skeleton';

interface ArticleSkeletonProps {
  count?: number;
  showImage?: boolean;
  className?: string;
}

export function ArticleSkeleton({ 
  count = 1, 
  showImage = true,
  className 
}: ArticleSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            relative overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700
            bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800
            p-3 sm:p-4 shadow-md animate-pulse
            ${className || ''}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-indigo-500/5 dark:from-amber-500/10 dark:to-indigo-500/10" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:gap-4">
            {showImage && (
              <Skeleton className="h-40 sm:h-28 md:h-32 w-full sm:w-32 md:w-36 flex-shrink-0 rounded-xl" />
            )}
            <div className="flex flex-1 flex-col justify-between gap-2 sm:gap-3 min-w-0">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton variant="circular" className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 sm:h-6 w-3/4" />
                <TextSkeleton lines={2} />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

