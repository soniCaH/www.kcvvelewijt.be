/**
 * Article Detail Page — Loading Skeleton
 * Matches the ArticleHeader + metadata + body + related content layout
 */

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Article header — full-width image with title overlay */}
      <div className="relative h-72 animate-pulse bg-gray-200 md:h-96">
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent p-6">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-8 w-full max-w-lg rounded bg-white/10" />
            <div className="h-6 w-3/4 max-w-md rounded bg-white/15" />
          </div>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl animate-pulse gap-4 px-4 py-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>

      {/* Article body prose */}
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8">
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-4/5 rounded bg-gray-200" />
        <div className="mt-6 h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="mt-6 h-48 w-full rounded-sm bg-gray-200" />
        <div className="mt-6 h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
      </div>

      {/* Related content slider */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-60 flex-shrink-0 overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-[3/2] bg-gray-200" />
                <div className="space-y-2 p-3">
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
