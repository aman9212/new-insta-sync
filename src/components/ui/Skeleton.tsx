interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-lg"
            style={{ height: 16, width: `${60 + Math.random() * 30}%` }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`skeleton rounded-lg ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4" role="status" aria-label="Loading card">
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-2/3 h-4" />
      <div className="flex justify-between pt-2">
        <Skeleton className="w-20 h-5" />
        <Skeleton className="w-12 h-5" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden" role="status" aria-label="Loading table">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}