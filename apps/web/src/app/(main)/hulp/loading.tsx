/**
 * Help / Hulp page — route-level loading skeleton
 *
 * Renders for full cold navigations (e.g. direct URL hit before the RSC
 * payload arrives). Uses the same SectionStack + PageHero layout as
 * page.tsx so the skeleton is structurally identical to the real page.
 * The search shell and skeleton grid mirror the Suspense fallback.
 */

import { PageHero } from "@/components/design-system/PageHero";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { SearchInputShell } from "@/components/hulp/HulpPage/SearchInputShell";
import { QuestionCardSkeletonGrid } from "@/components/hulp/HulpPage/QuestionCardSkeleton";

export default function HulpLoading() {
  return (
    <SectionStack
      sections={[
        {
          key: "hero",
          bg: "kcvv-black",
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
          content: (
            <PageHero
              size="compact"
              gradient="dark"
              label="Help"
              headline="Vind de juiste persoon"
              body="Stel je vraag of blader door de categorieën hieronder."
            />
          ),
          transition: {
            type: "diagonal",
            direction: "right",
            overlap: "full",
          },
        },
        {
          key: "content",
          bg: "gray-100",
          content: (
            <div className="max-w-inner-lg mx-auto space-y-12 px-4 md:px-10">
              <SearchInputShell />
              <QuestionCardSkeletonGrid count={4} label="Hulppagina laden..." />
            </div>
          ),
          transition: { type: "diagonal", direction: "left" },
        },
      ]}
    />
  );
}
