export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-2.5 w-24 bg-cream-mid rounded mb-3" />
        <div className="h-9 w-64 bg-cream-mid rounded" />
        <div className="w-12 h-px bg-cream-mid mt-4" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="h-32 bg-navy/10 rounded" />
        <div className="h-32 bg-cream-mid rounded" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-2 w-24 bg-cream-mid rounded mb-1" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-cream-mid p-6">
              <div className="h-px w-full bg-cream-mid mb-5" />
              <div className="h-2 w-16 bg-cream-mid rounded mb-3" />
              <div className="h-6 w-3/4 bg-cream-mid rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-cream-mid rounded" />
                <div className="h-3 bg-cream-mid rounded w-5/6" />
                <div className="h-3 bg-cream-mid rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:border-l lg:border-cream-mid lg:pl-8">
          <div className="h-2.5 w-28 bg-cream-mid rounded mb-5" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 mb-6">
              <div className="shrink-0 w-11">
                <div className="h-2 w-8 bg-cream-mid rounded mb-1" />
                <div className="h-7 w-8 bg-cream-mid rounded" />
              </div>
              <div className="flex-1">
                <div className="h-4 bg-cream-mid rounded mb-2" />
                <div className="h-2.5 w-24 bg-cream-mid rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
