import { Skeleton, TextSkeleton } from './Skeleton';

interface CandleSkeletonProps {
  count?: number;
  className?: string;
}

export function CandleSkeleton({ count = 1, className }: CandleSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            rounded-2xl border border-slate-300 dark:border-slate-700
            bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md
            ${className || ''}
          `}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Skeleton variant="circular" className="h-6 w-24" />
                <Skeleton variant="circular" className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <TextSkeleton lines={2} />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton variant="circular" className="h-8 w-8" />
                <Skeleton variant="circular" className="h-8 w-8" />
                <Skeleton variant="circular" className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

