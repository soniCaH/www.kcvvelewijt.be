/**
 * Club Page (Dynamic) — Loading Skeleton
 * Matches the PageTitle + article body layout
 */

export default function ClubPageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* PageTitle placeholder */}
      <div className="bg-kcvv-dark-bg py-10 px-4">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-10 w-64 rounded bg-white/10" />
        </div>
      </div>

      {/* Article body prose */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-4/5 rounded bg-gray-200" />
        <div className="h-48 w-full rounded-sm bg-gray-200 mt-6" />
        <div className="h-5 w-full rounded bg-gray-200 mt-6" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
