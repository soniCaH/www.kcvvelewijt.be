/**
 * Loading Envelope Drift Guard
 *
 * Prevents loading.tsx skeletons from silently desyncing with their page.tsx
 * envelopes. Parametrized over all (main) and (landing) routes that have a
 * loading.tsx — every skeleton is now a bespoke (non-SectionStack) envelope, so
 * the guard verifies the root element className matches the declared contract.
 *
 * @see docs/prd/loading-skeleton-consistency.md — Phase 4
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { globSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Loading components
// ---------------------------------------------------------------------------
import ClubLoading from "../(main)/club/loading";
import JeugdLoading from "../(landing)/jeugd/loading";
import PloegenLoading from "../(main)/ploegen/loading";
import HulpLoading from "../(main)/hulp/loading";
import KalenderLoading from "../(main)/kalender/loading";
import NieuwsLoading from "../(landing)/nieuws/loading";
import SponsorsLoading from "../(landing)/sponsors/loading";
import NieuwsDetailLoading from "../(main)/nieuws/[slug]/loading";
import ScheurkalenderLoading from "../(main)/scheurkalender/loading";
import ZoekenLoading from "../(main)/zoeken/loading";
import ClubDetailLoading from "../(main)/club/[slug]/loading";
import AngelsLoading from "../(main)/club/angels/loading";
import BestuurLoading from "../(main)/club/bestuur/loading";
import JeugdbestuurLoading from "../(main)/club/jeugdbestuur/loading";
import PloegenDetailLoading from "../(main)/ploegen/[slug]/loading";
import SpelersDetailLoading from "../(main)/spelers/[slug]/loading";
import StafDetailLoading from "../(main)/staf/[slug]/loading";
import TegenstanderLoading from "../(main)/tegenstander/[clubId]/loading";
import WedstrijdLoading from "../(main)/wedstrijd/[matchId]/loading";

describe("loading.tsx envelope drift guard", () => {
  // -------------------------------------------------------------------------
  // Root className contract
  // -------------------------------------------------------------------------

  interface NonSectionStackRoute {
    name: string;
    Loading: ComponentType;
    expectedRootClass: string;
  }

  const nonSectionStackRoutes: NonSectionStackRoute[] = [
    {
      name: "/club",
      Loading: ClubLoading,
      // Phase 10 (#2121): rebuilt off SectionStack — cream paper field hosts the
      // compact PageHero + StripedSeam + nav-hub skeleton grid.
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/hulp",
      Loading: HulpLoading,
      // Phase 7 (#2056): the hub is no longer a SectionStack page — cream-paper
      // skeleton shaped like the two-door nav + dark hero + finder.
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/kalender",
      Loading: KalenderLoading,
      // Phase 6.D (#1994): cream paper field hosts the reskinned paper/ink panel.
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/nieuws",
      Loading: NieuwsLoading,
      expectedRootClass: "w-full",
    },
    {
      name: "/nieuws/[slug]",
      Loading: NieuwsDetailLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/scheurkalender",
      Loading: ScheurkalenderLoading,
      // Phase 10 (#2120): cream paper field hosts the compact PageHero.
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/zoeken",
      Loading: ZoekenLoading,
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/club/[slug]",
      Loading: ClubDetailLoading,
      // Phase 10 (#2120): cream paper field hosts the compact PageHero.
      expectedRootClass: "bg-cream min-h-screen",
    },
    {
      name: "/club/angels",
      Loading: AngelsLoading,
      expectedRootClass: "min-h-screen space-y-12",
    },
    {
      name: "/club/bestuur",
      Loading: BestuurLoading,
      expectedRootClass: "min-h-screen space-y-12",
    },
    {
      name: "/club/jeugdbestuur",
      Loading: JeugdbestuurLoading,
      expectedRootClass: "min-h-screen space-y-12",
    },
    {
      name: "/jeugd",
      Loading: JeugdLoading,
      // Phase 7 (#2038): cream tracer composition (header + nav grid + youth
      // directory), no SectionStack envelope. Outer container is a
      // `<PageContainer width="index">` (matches the page's index width).
      expectedRootClass: "mx-auto w-full px-4 md:px-8 max-w-7xl py-10 sm:py-14",
    },
    {
      name: "/ploegen",
      Loading: PloegenLoading,
      // Outer container is a `<PageContainer width="index">` (page's index width).
      expectedRootClass: "mx-auto w-full px-4 md:px-8 max-w-7xl py-10 sm:py-14",
    },
    {
      name: "/sponsors",
      Loading: SponsorsLoading,
      // Phase 7 (#2033): cream editorial header + SponsorTile grid skeleton,
      // mirroring the rebuilt /sponsors page (no SectionStack envelope). Outer
      // container is a `<PageContainer width="index">` (page's index width).
      expectedRootClass: "mx-auto w-full px-4 md:px-8 max-w-7xl py-10 sm:py-14",
    },
    {
      name: "/ploegen/[slug]",
      Loading: PloegenDetailLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/spelers/[slug]",
      Loading: SpelersDetailLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/staf/[slug]",
      Loading: StafDetailLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/tegenstander/[clubId]",
      Loading: TegenstanderLoading,
      // Phase 10 (#2141): reskinned to the cream-deep paper register, matching
      // the page's `bg-cream-deep` wrapper.
      expectedRootClass: "bg-cream-deep min-h-screen",
    },
    {
      name: "/wedstrijd/[matchId]",
      Loading: WedstrijdLoading,
      expectedRootClass: "min-h-screen",
    },
  ];

  describe("Non-SectionStack routes — root className contract", () => {
    it.each(nonSectionStackRoutes)(
      "$name loading root className matches envelope contract",
      ({ Loading, expectedRootClass }) => {
        const { container } = render(<Loading />);
        expect(container.firstElementChild?.className).toBe(expectedRootClass);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Completeness guard — fail if a loading.tsx is added but not tested
  // -------------------------------------------------------------------------

  it("test arrays cover all loading.tsx files under (main) and (landing)", () => {
    const appDir = resolve(__dirname, "..");
    const loadingFiles = [
      ...globSync("(main)/**/loading.tsx", { cwd: appDir }),
      ...globSync("(landing)/**/loading.tsx", { cwd: appDir }),
    ];
    const expectedRouteNames = new Set(
      nonSectionStackRoutes.map(({ name }) => name.replace(/^\//, "")),
    );
    const stripGroup = (file: string) =>
      file.replace(/^\((main|landing)\)\//, "").replace(/\/loading\.tsx$/, "");
    const onDiskRouteNames = new Set(loadingFiles.map(stripGroup));
    const missingFiles = loadingFiles
      .filter((f) => !expectedRouteNames.has(stripGroup(f)))
      .sort();
    const staleInArrays = [...expectedRouteNames]
      .filter((name) => !onDiskRouteNames.has(name))
      .sort();
    expect(
      missingFiles,
      `loading.tsx files on disk not covered by test arrays: ${missingFiles.join(", ")}`,
    ).toEqual([]);
    expect(
      staleInArrays,
      `test array entries with no matching loading.tsx on disk: ${staleInArrays.join(", ")}`,
    ).toEqual([]);
  });
});
