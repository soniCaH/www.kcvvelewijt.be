/**
 * Help / Hulp page — server-render loading skeleton
 *
 * Mirrors the new HulpPage layout (post-#1237): real PageHero (props are
 * static, server-renders identically), search input shell, then the same
 * QuestionCardSkeletonGrid used for the in-search loading state. Sharing
 * the grid component prevents the two skeletons from drifting visually.
 */

import { PageHero } from "@/components/design-system/PageHero";
import { Search } from "@/lib/icons";
import { QuestionCardSkeletonGrid } from "@/components/hulp/HulpPage/QuestionCardSkeleton";

export default function HulpLoading() {
  return (
    <div className="min-h-screen">
      {/* Real hero — props match HulpPage.tsx exactly so first paint is identical */}
      <PageHero
        size="compact"
        gradient="dark"
        label="Help"
        headline="Vind de juiste persoon"
        body="Stel je vraag of blader door de categorieën hieronder."
      />

      {/* Content section — gray background matches the real page */}
      <div className="bg-gray-100">
        <div className="mx-auto max-w-inner-lg space-y-12 px-4 py-12 md:px-10">
          {/* Search input shell — visual mimic of HulpSearchInput.tsx */}
          <div>
            <div className="relative mx-auto w-full max-w-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-kcvv-gray">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              {/* Match HulpSearchInput's py-5 + base text + border + shadow.
                  Empty div — no real input — keeps it non-interactive. */}
              <div
                className="w-full rounded-sm border border-gray-200 bg-white py-5 pl-14 pr-5 shadow-md"
                style={{ height: "60px" }}
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-center text-xs text-kcvv-gray">
              Tip: probeer trefwoorden zoals <em>inschrijving</em>,{" "}
              <em>sportongeval</em>, of <em>transfer</em>.
            </p>
          </div>

          {/* Card grid skeleton — same component as the in-search loading */}
          <QuestionCardSkeletonGrid count={4} label="Hulppagina laden..." />
        </div>
      </div>
    </div>
  );
}
