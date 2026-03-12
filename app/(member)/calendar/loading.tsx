export default function CalendarLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-2.5 w-24 bg-cream-mid rounded mb-3" />
        <div className="h-9 w-52 bg-cream-mid rounded" />
        <div className="w-12 h-px bg-cream-mid mt-4" />
      </div>

      {/* Calendar skeleton */}
      <div className="bg-white border border-cream-mid p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-7 bg-cream-mid rounded" />
          <div className="h-6 w-36 bg-cream-mid rounded" />
          <div className="h-7 w-7 bg-cream-mid rounded" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="h-5 flex items-center justify-center">
              <div className="h-2 w-4 bg-cream-mid rounded" />
            </div>
          ))}
        </div>

        {/* Calendar grid — 5 weeks */}
        {[1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="grid grid-cols-7 gap-px mb-px">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className="h-20 bg-cream-light border border-cream-mid p-1.5"
              >
                <div className="h-2.5 w-4 bg-cream-mid rounded mb-2" />
                {Math.random() > 0.8 && (
                  <div className="h-4 bg-navy/10 rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
