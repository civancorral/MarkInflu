export function DiscoverySkeleton() {
  return (
    <div className="space-y-6">
      {/* Results Count Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-48 skeleton rounded" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Cover */}
            <div className="h-24 skeleton" />
            
            {/* Avatar */}
            <div className="relative -mt-10 px-4">
              <div className="h-20 w-20 rounded-2xl border-4 border-card skeleton" />
            </div>

            {/* Content */}
            <div className="p-4 pt-2 space-y-3">
              <div>
                <div className="h-5 w-32 skeleton rounded mb-1" />
                <div className="h-4 w-24 skeleton rounded" />
              </div>

              <div className="flex gap-1">
                <div className="h-5 w-16 skeleton rounded-full" />
                <div className="h-5 w-14 skeleton rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3">
                <div className="text-center space-y-1">
                  <div className="h-6 w-12 mx-auto skeleton rounded" />
                  <div className="h-3 w-16 mx-auto skeleton rounded" />
                </div>
                <div className="text-center space-y-1">
                  <div className="h-6 w-10 mx-auto skeleton rounded" />
                  <div className="h-3 w-16 mx-auto skeleton rounded" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="h-8 w-8 skeleton rounded-lg" />
                  <div className="h-8 w-8 skeleton rounded-lg" />
                </div>
                <div className="h-4 w-20 skeleton rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
