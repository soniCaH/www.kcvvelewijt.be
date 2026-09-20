/**
 * Loading Envelope Drift Guard
 *
 * Prevents loading.tsx skeletons from silently desyncing with their page.tsx
 * envelopes. Parametrized over all (main) and (landing) routes that have a
 * loading.tsx — every skeleton is now a bespoke (non-SectionStack) envelope, so
 * the guard verifies the root element className matches the declared contract.
 *
 * Extended by #2573 (decision #2432/#2431) — this file predates that ticket's
 * rewrite and its contract is *updated, not replaced*: the original root-
 * className check stays, and two guards are added:
 *
 *   - **One announcement shape.** Every route renders exactly one
 *     `<LoadingAnnouncement>` (`role="status"`, `aria-busy`, `aria-live`,
 *     `sr-only`) with its declared Dutch label.
 *   - **No wrong-page `<h1>`.** A `loading.tsx` whose fallback also ships in a
 *     sibling segment's streamed HTML (#2432 §1 — the six-file leak this
 *     ticket could not fully close by moving files, see the PR body) must
 *     never render a heading naming a *different* page. `/club` and
 *     `/club/[slug]` are the two concrete fixes: both now render bars, never
 *     a real `<h1>`.
 *
 * @see docs/prd/loading-skeleton-consistency.md — original Phase 4 guard
 * @see https://github.com/kcvvelewijt/www.kcvvelewijt.be/issues/2573
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
import HomepageLoading from "../(landing)/loading";
import ContactLoading from "../(main)/club/contact/loading";
import GeschiedenisLoading from "../(main)/club/geschiedenis/loading";
import UltrasLoading from "../(main)/club/ultras/loading";
import EvenementenLoading from "../(main)/evenementen/loading";
import EvenementDetailLoading from "../(main)/evenementen/[slug]/loading";
import WedstrijdenLoading from "../(main)/ploegen/[slug]/wedstrijden/loading";
import PrivacyLoading from "../(main)/privacy/loading";
import ShareLoading from "../(main)/share/loading";
import GalerijLoading from "../(main)/galerij/loading";
import GalerijDetailLoading from "../(main)/galerij/[slug]/loading";
import WordLidLoading from "../(main)/club/word-lid/loading";

describe("loading.tsx envelope drift guard", () => {
  // -------------------------------------------------------------------------
  // Root className + announcement contract
  // -------------------------------------------------------------------------

  interface LoadingRoute {
    name: string;
    Loading: ComponentType;
    expectedRootClass: string;
    /** The exact `<LoadingAnnouncement label>` text this route renders. */
    announcement: string;
  }

  const routes: LoadingRoute[] = [
    {
      name: "/club",
      Loading: ClubLoading,
      // Phase 10 (#2121): rebuilt off SectionStack — cream paper field hosts the
      // compact PageHero + StripedSeam + nav-hub skeleton grid.
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Club laden…",
    },
    {
      name: "/hulp",
      Loading: HulpLoading,
      // Phase 7 (#2056): the hub is no longer a SectionStack page — cream-paper
      // skeleton shaped like the two-door nav + dark hero + finder.
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Hulppagina laden…",
    },
    {
      name: "/kalender",
      Loading: KalenderLoading,
      // Phase 6.D (#1994): cream paper field hosts the reskinned paper/ink panel.
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Kalender laden…",
    },
    {
      name: "/nieuws",
      Loading: NieuwsLoading,
      expectedRootClass: "w-full",
      announcement: "Nieuws laden…",
    },
    {
      name: "/nieuws/[slug]",
      Loading: NieuwsDetailLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Artikel laden…",
    },
    {
      name: "/scheurkalender",
      Loading: ScheurkalenderLoading,
      // Phase 10 (#2120): cream paper field hosts the compact PageHero.
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Scheurkalender laden…",
    },
    {
      name: "/zoeken",
      Loading: ZoekenLoading,
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Zoekpagina laden…",
    },
    {
      name: "/club/[slug]",
      Loading: ClubDetailLoading,
      // Phase 10 (#2120): cream paper field hosts the compact PageHero.
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Pagina laden…",
    },
    {
      name: "/club/angels",
      Loading: AngelsLoading,
      expectedRootClass: "min-h-screen space-y-12",
      announcement: "Angels laden…",
    },
    {
      name: "/club/bestuur",
      Loading: BestuurLoading,
      expectedRootClass: "min-h-screen space-y-12",
      announcement: "Bestuur laden…",
    },
    {
      name: "/club/jeugdbestuur",
      Loading: JeugdbestuurLoading,
      expectedRootClass: "min-h-screen space-y-12",
      announcement: "Jeugdbestuur laden…",
    },
    {
      name: "/jeugd",
      Loading: JeugdLoading,
      // #2555: the route now opens on the shared opening's dark register, so
      // the skeleton leads with the same full-bleed `bg-jersey-deep-dark`
      // band the page paints — the container starts below the seam.
      expectedRootClass: "bg-jersey-deep-dark",
      announcement: "Jeugdwerking laden…",
    },
    {
      name: "/ploegen",
      Loading: PloegenLoading,
      // Outer container is a `<PageContainer width="index">` (page's index width).
      expectedRootClass:
        "mx-auto w-full px-4 md:px-8 max-w-[var(--container-index)] py-12 sm:py-16",
      announcement: "Ploegen laden…",
    },
    {
      name: "/sponsors",
      Loading: SponsorsLoading,
      // Phase 7 (#2033): cream editorial header + SponsorTile grid skeleton,
      // mirroring the rebuilt /sponsors page (no SectionStack envelope). Outer
      // container is a `<PageContainer width="index">` (page's index width).
      expectedRootClass:
        "mx-auto w-full px-4 md:px-8 max-w-[var(--container-index)] py-10 sm:py-14",
      announcement: "Sponsors laden…",
    },
    {
      name: "/ploegen/[slug]",
      Loading: PloegenDetailLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Ploeg laden…",
    },
    {
      name: "/spelers/[slug]",
      Loading: SpelersDetailLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Spelersprofiel laden…",
    },
    {
      name: "/staf/[slug]",
      Loading: StafDetailLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Stafprofiel laden…",
    },
    {
      name: "/tegenstander/[clubId]",
      Loading: TegenstanderLoading,
      // Phase 10 (#2141): reskinned to the cream-deep paper register, matching
      // the page's `bg-cream-deep` wrapper.
      expectedRootClass: "bg-cream-deep min-h-screen",
      announcement: "Tegenstander laden…",
    },
    {
      name: "/wedstrijd/[matchId]",
      Loading: WedstrijdLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Wedstrijd laden…",
    },
    {
      name: "/",
      Loading: HomepageLoading,
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Startpagina laden…",
    },
    {
      name: "/club/contact",
      Loading: ContactLoading,
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Contactpagina laden…",
    },
    {
      name: "/club/geschiedenis",
      Loading: GeschiedenisLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Geschiedenis laden…",
    },
    {
      name: "/club/ultras",
      Loading: UltrasLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Ultras laden…",
    },
    {
      name: "/evenementen",
      Loading: EvenementenLoading,
      expectedRootClass: "bg-jersey-deep-dark flex min-h-screen flex-col",
      announcement: "Evenementen laden…",
    },
    {
      name: "/evenementen/[slug]",
      Loading: EvenementDetailLoading,
      expectedRootClass: "bg-cream",
      announcement: "Evenement laden…",
    },
    {
      name: "/ploegen/[slug]/wedstrijden",
      Loading: WedstrijdenLoading,
      expectedRootClass: "min-h-screen",
      announcement: "Wedstrijden laden…",
    },
    {
      name: "/privacy",
      Loading: PrivacyLoading,
      expectedRootClass: "bg-cream py-12 sm:py-16",
      announcement: "Privacyverklaring laden…",
    },
    {
      name: "/share",
      Loading: ShareLoading,
      expectedRootClass: "bg-cream min-h-screen",
      announcement: "Deelafbeelding-tool laden…",
    },
    {
      name: "/galerij",
      Loading: GalerijLoading,
      expectedRootClass: "bg-cream flex min-h-screen flex-col",
      announcement: "Fotogalerij laden…",
    },
    {
      name: "/galerij/[slug]",
      Loading: GalerijDetailLoading,
      expectedRootClass: "bg-cream",
      announcement: "Fotogalerij laden…",
    },
    {
      name: "/club/word-lid",
      Loading: WordLidLoading,
      // The route is fully static (no data fetch), so this reuses the real
      // `<PageHero>` + `<MembershipForm>` unshimmered — new in #2570 review
      // round 2, replacing the absence that made it fall through to
      // `/club`'s own skeleton. Top air is the up-link chip's own now
      // (#2877), so the root keeps only its bottom padding.
      expectedRootClass: "bg-cream pb-12 sm:pb-16",
      announcement: "Word lid laden…",
    },
  ];

  describe("Root className contract", () => {
    it.each(routes)(
      "$name loading root className matches envelope contract",
      ({ Loading, expectedRootClass }) => {
        const { container } = render(<Loading />);
        expect(container.firstElementChild?.className).toBe(expectedRootClass);
      },
    );
  });

  // -------------------------------------------------------------------------
  // One announcement shape (#2432 §4) — every route, no exceptions
  // -------------------------------------------------------------------------

  describe("Screen-reader announcement — one shape, every route", () => {
    it.each(routes)(
      "$name renders exactly one canonical <LoadingAnnouncement>",
      ({ Loading, announcement }) => {
        render(<Loading />);
        const statuses = screen.getAllByRole("status");
        expect(statuses).toHaveLength(1);
        const [status] = statuses;
        expect(status).toHaveAttribute("aria-busy", "true");
        expect(status).toHaveAttribute("aria-live", "polite");
        expect(status).toHaveClass("sr-only");
        expect(status).toHaveTextContent(announcement);
        // Ellipsis character, never three periods (#2432 §4).
        expect(announcement.endsWith("...")).toBe(false);
      },
    );
  });

  // -------------------------------------------------------------------------
  // No skeleton announces a different page than the one asked for (#2432 §2)
  // -------------------------------------------------------------------------

  describe("No wrong-page <h1> — the /club leak (#2432 §1/§2)", () => {
    // `/club/loading.tsx` ships in the streamed HTML of every `/club/*` child
    // (Next wraps the whole subtree in its Suspense boundary), and moving it
    // into a route group to stop that would also require relocating
    // `page.tsx`, which the file-ownership contract forbids mid-wave (see the
    // PR body). The content-level mitigation: neither of these ever renders a
    // real heading, so a leaked fallback can never show `/club`'s own text
    // on a `/club/bestuur` navigation, or a stale CMS title on `/club/[slug]`.
    it("/club renders zero heading elements", () => {
      const { container } = render(<ClubLoading />);
      expect(container.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(
        0,
      );
    });

    it("/club/[slug] renders zero heading elements (its headline is CMS data)", () => {
      const { container } = render(<ClubDetailLoading />);
      expect(container.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(
        0,
      );
    });
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
      routes.map(({ name }) => name.replace(/^\//, "")),
    );
    const stripGroup = (file: string) =>
      file.replace(/^\((main|landing)\)\//, "").replace(/\/?loading\.tsx$/, "");
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
