import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
    />
  );
}

// Вспомогательные компоненты для разных типов контента
export function TextSkeleton({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton({ 
  width = 'w-24', 
  className 
}: { 
  width?: string; 
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      className={cn('h-10', width, className)}
    />
  );
}

export function AvatarSkeleton({ 
  size = 'w-10 h-10', 
  className 
}: { 
  size?: string; 
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      className={cn(size, className)}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl border border-slate-300 dark:border-slate-700',
      'bg-white dark:bg-slate-800 p-4 shadow-md',
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="circular" className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <TextSkeleton lines={2} />
      </div>
    </div>
  );
}

