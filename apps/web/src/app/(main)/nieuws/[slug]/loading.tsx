/**
 * Article Detail Page — Loading Skeleton
 * Matches the ArticleHeader + metadata + body + related content layout
 */

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Article header — full-width image with title overlay */}
      <div className="relative h-72 md:h-96 bg-gray-200 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/70 to-transparent">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-8 w-full max-w-lg rounded bg-white/10" />
            <div className="h-6 w-3/4 max-w-md rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-4 animate-pulse">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>

      {/* Article body prose */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-4/5 rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200 mt-6" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-48 w-full rounded-sm bg-gray-200 mt-6" />
        <div className="h-5 w-full rounded bg-gray-200 mt-6" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
      </div>

      {/* Related content slider */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-60 rounded-sm bg-white border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="aspect-[3/2] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
