/**
 * Loading Envelope Drift Guard
 *
 * Prevents loading.tsx skeletons from silently desyncing with their page.tsx
 * envelopes. Parametrized over all (main) and (landing) routes that have a
 * loading.tsx.
 *
 * - SectionStack routes: verifies loading.tsx renders via the shared factory
 *   by checking transition count and background classes.
 * - Non-SectionStack routes: verifies the root element className matches the
 *   declared envelope contract.
 *
 * @see docs/prd/loading-skeleton-consistency.md — Phase 4
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { globSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// SectionStack loading components
// ---------------------------------------------------------------------------
import ClubLoading from "../(main)/club/loading";
import HulpLoading from "../(main)/hulp/loading";
import JeugdLoading from "../(landing)/jeugd/loading";
import PloegenLoading from "../(main)/ploegen/loading";
import SponsorsLoading from "../(landing)/sponsors/loading";

// ---------------------------------------------------------------------------
// Non-SectionStack loading components
// ---------------------------------------------------------------------------
import EventsLoading from "../(landing)/events/loading";
import KalenderLoading from "../(main)/kalender/loading";
import NieuwsLoading from "../(landing)/nieuws/loading";
import NieuwsDetailLoading from "../(main)/nieuws/[slug]/loading";
import ScheurkalenderLoading from "../(main)/scheurkalender/loading";
import ZoekenLoading from "../(main)/zoeken/loading";
import ClubDetailLoading from "../(main)/club/[slug]/loading";
import AngelsLoading from "../(main)/club/angels/loading";
import BestuurLoading from "../(main)/club/bestuur/loading";
import JeugdbestuurLoading from "../(main)/club/jeugdbestuur/loading";
import OrganigramLoading from "../(main)/club/organigram/loading";
import PloegenDetailLoading from "../(main)/ploegen/[slug]/loading";
import SpelersDetailLoading from "../(main)/spelers/[slug]/loading";
import StafDetailLoading from "../(main)/staf/[slug]/loading";
import TegenstanderLoading from "../(main)/tegenstander/[clubId]/loading";
import WedstrijdLoading from "../(main)/wedstrijd/[matchId]/loading";

// ---------------------------------------------------------------------------
// SectionStack routes — shared factory envelope
// ---------------------------------------------------------------------------

interface SectionStackRoute {
  name: string;
  Loading: ComponentType;
  expectedTransitions: number;
  expectedBgClasses: string[];
}

const sectionStackRoutes: SectionStackRoute[] = [
  {
    name: "/club",
    Loading: ClubLoading,
    expectedTransitions: 3,
    expectedBgClasses: ["bg-kcvv-black", "bg-gray-100", "bg-kcvv-green-dark"],
  },
  {
    name: "/hulp",
    Loading: HulpLoading,
    expectedTransitions: 1,
    expectedBgClasses: ["bg-kcvv-black", "bg-gray-100"],
  },
  {
    name: "/jeugd",
    Loading: JeugdLoading,
    expectedTransitions: 4,
    expectedBgClasses: ["bg-kcvv-black", "bg-gray-100", "bg-kcvv-green-dark"],
  },
  {
    name: "/ploegen",
    Loading: PloegenLoading,
    expectedTransitions: 3,
    expectedBgClasses: ["bg-kcvv-black", "bg-gray-100"],
  },
  {
    name: "/sponsors",
    Loading: SponsorsLoading,
    expectedTransitions: 2,
    expectedBgClasses: ["bg-kcvv-black", "bg-gray-100"],
  },
];

describe("loading.tsx envelope drift guard", () => {
  describe("SectionStack routes — shared factory", () => {
    it.each(sectionStackRoutes)(
      "$name loading renders via SectionStack with correct transitions",
      ({ Loading, expectedTransitions }) => {
        render(<Loading />);
        const transitions = screen.getAllByTestId("section-transition");
        expect(transitions).toHaveLength(expectedTransitions);
      },
    );

    it.each(sectionStackRoutes)(
      "$name loading renders all expected background classes",
      ({ Loading, expectedBgClasses }) => {
        const { container } = render(<Loading />);
        for (const cls of expectedBgClasses) {
          expect(
            container.querySelector(`.${CSS.escape(cls)}`),
            `expected .${cls} to be present in rendered output`,
          ).not.toBeNull();
        }
      },
    );
  });

  // -------------------------------------------------------------------------
  // Non-SectionStack routes — root className contract
  // -------------------------------------------------------------------------

  interface NonSectionStackRoute {
    name: string;
    Loading: ComponentType;
    expectedRootClass: string;
  }

  const nonSectionStackRoutes: NonSectionStackRoute[] = [
    {
      name: "/events",
      Loading: EventsLoading,
      expectedRootClass: "min-h-screen bg-linear-to-br from-gray-50 to-white",
    },
    {
      name: "/kalender",
      Loading: KalenderLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
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
      expectedRootClass: "min-h-screen bg-gray-100",
    },
    {
      name: "/zoeken",
      Loading: ZoekenLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
    },
    {
      name: "/club/[slug]",
      Loading: ClubDetailLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
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
      name: "/club/organigram",
      Loading: OrganigramLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/ploegen/[slug]",
      Loading: PloegenDetailLoading,
      expectedRootClass: "min-h-screen",
    },
    {
      name: "/spelers/[slug]",
      Loading: SpelersDetailLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
    },
    {
      name: "/staf/[slug]",
      Loading: StafDetailLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
    },
    {
      name: "/tegenstander/[clubId]",
      Loading: TegenstanderLoading,
      expectedRootClass: "min-h-screen bg-gray-100",
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
    const testedRoutes =
      sectionStackRoutes.length + nonSectionStackRoutes.length;
    const expectedRouteNames = new Set(
      [...sectionStackRoutes, ...nonSectionStackRoutes].map(({ name }) =>
        name.replace(/^\//, ""),
      ),
    );
    const stripGroup = (file: string) =>
      file.replace(/^\((main|landing)\)\//, "").replace(/\/loading\.tsx$/, "");
    const missingFiles = loadingFiles
      .filter((f) => !expectedRouteNames.has(stripGroup(f)))
      .sort();
    expect(
      loadingFiles.length,
      `Found ${loadingFiles.length} loading.tsx files on disk but only ${testedRoutes} in test arrays. ` +
        `Missing: ${missingFiles.join(", ")}`,
    ).toBe(testedRoutes);
  });
});
