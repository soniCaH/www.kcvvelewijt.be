/**
 * TeamHero Component Tests
 *
 * Covers:
 *  - Kicker: "KCVV Elewijt" for senior, "KCVV Elewijt · Jeugd" for youth.
 *  - Headline: the display name, rendered verbatim — never derived here (#2630).
 *  - Meta row: division pill for senior; youth band pill for youth.
 *  - Meta auto-hide when the pill is absent.
 *  - Tagline renders and auto-hides.
 *  - Artefact state: "photo" when teamImageUrl present, "jersey" fallback when absent.
 *  - Photo viewer (#3447): the photo opens full screen, uncropped; the jersey
 *    fallback has nothing to open.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LightboxProps } from "yet-another-react-lightbox";
import { TeamHero } from "./TeamHero";

// The library draws on a portal and measures layout; what TeamHero owns is
// the props it hands over, so capture those at the module boundary.
const lightboxProps = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("yet-another-react-lightbox", () => ({
  default: (props: unknown) => {
    lightboxProps.current = props;
    return null;
  },
}));

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/track-event", () => ({ trackEvent }));

const BASE_SENIOR = {
  displayName: "A-ploeg",
  teamType: "senior" as const,
  divisionFull: "Eerste Elftal A – 3e Nat. A",
};

describe("TeamHero", () => {
  describe("Kicker", () => {
    it("renders 'KCVV Elewijt' for a senior team", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(screen.getByTestId("team-hero-kicker").textContent).toBe(
        "KCVV Elewijt",
      );
    });

    it("renders 'KCVV Elewijt · Jeugd' for a youth team", () => {
      render(<TeamHero displayName="U13" teamType="youth" ageGroup="U13" />);
      expect(screen.getByTestId("team-hero-kicker").textContent).toBe(
        "KCVV Elewijt · Jeugd",
      );
    });
  });

  describe("Headline", () => {
    it("renders the display name verbatim", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.textContent).toBe("A-ploeg.");
    });

    it("never re-derives the heading from the shared age band", () => {
      // Reserven's `age` is the senior code "A" — the same band the A-ploeg
      // carries. The hero used to head this page `A-ploeg.` (#2630). The band
      // no longer reaches the heading at all; it is not even a prop.
      render(<TeamHero displayName="Reserven" teamType="senior" />);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
        "Reserven.",
      );
    });

    it("names the section after the team it heads", () => {
      render(<TeamHero displayName="U10P" teamType="youth" />);
      expect(screen.getByTestId("team-hero").getAttribute("aria-label")).toBe(
        "U10P · ploegpagina",
      );
    });
  });

  describe("Meta row (pill)", () => {
    it("shows the division pill for a senior team with data", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("Eerste Elftal A – 3e Nat. A");
    });

    it("falls back to short division when divisionFull is absent", () => {
      render(
        <TeamHero displayName="A-ploeg" teamType="senior" division="3NA" />,
      );
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("3NA");
    });

    it("shows the youth band for a youth team", () => {
      render(<TeamHero displayName="U13" teamType="youth" ageGroup="U13" />);
      const meta = screen.getByTestId("team-hero-meta");
      expect(meta.textContent).toContain("Middenbouw");
    });

    it("shows Bovenbouw band for U17", () => {
      render(<TeamHero displayName="U17" teamType="youth" ageGroup="U17" />);
      expect(screen.getByTestId("team-hero-meta").textContent).toContain(
        "Bovenbouw",
      );
    });

    it("shows Onderbouw band for U9", () => {
      render(<TeamHero displayName="U9" teamType="youth" ageGroup="U9" />);
      expect(screen.getByTestId("team-hero-meta").textContent).toContain(
        "Onderbouw",
      );
    });

    it("auto-hides meta row when no division and no youth band", () => {
      render(<TeamHero displayName="A-ploeg" teamType="senior" />);
      expect(screen.queryByTestId("team-hero-meta")).toBeNull();
    });
  });

  describe("Tagline", () => {
    it("renders the tagline when provided", () => {
      render(
        <TeamHero {...BASE_SENIOR} tagline="Sterk, gedreven, één ploeg." />,
      );
      expect(screen.getByTestId("team-hero-tagline").textContent).toBe(
        "Sterk, gedreven, één ploeg.",
      );
    });

    it("auto-hides the tagline when absent", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(screen.queryByTestId("team-hero-tagline")).toBeNull();
    });
  });

  describe("Artefact state (photo vs JerseyShirt fallback)", () => {
    it("sets data-state='photo' when teamImageUrl is provided", () => {
      render(
        <TeamHero {...BASE_SENIOR} teamImageUrl="/fixtures/ploeg-a.jpg" />,
      );
      expect(
        screen.getByTestId("team-hero-artefact").getAttribute("data-state"),
      ).toBe("photo");
    });

    it("sets data-state='jersey' when teamImageUrl is absent", () => {
      render(<TeamHero {...BASE_SENIOR} />);
      expect(
        screen.getByTestId("team-hero-artefact").getAttribute("data-state"),
      ).toBe("jersey");
    });
  });

  describe("Photo viewer (#3447)", () => {
    const PHOTO = {
      teamImageUrl: "/fixtures/ploeg-a-crop.jpg",
      photoViewer: {
        fullUrl: "/fixtures/ploeg-a-full.jpg",
        teamSlug: "a-ploeg",
      },
    };
    const viewer = () => lightboxProps.current as LightboxProps;

    // The viewer is lazy-loaded on the first click. Import it once up front so
    // no test spends its budget on the cold module load.
    beforeAll(async () => {
      await import("./TeamPhotoViewer");
    });

    beforeEach(() => {
      lightboxProps.current = null;
      trackEvent.mockClear();
    });

    it("makes the photo a button named after the team", () => {
      render(<TeamHero {...BASE_SENIOR} {...PHOTO} />);
      expect(
        screen.getByRole("button", { name: "Teamfoto van A-ploeg vergroten" }),
      ).toBeInTheDocument();
    });

    it("has nothing to open on the jersey fallback", () => {
      render(<TeamHero {...BASE_SENIOR} photoViewer={PHOTO.photoViewer} />);
      expect(screen.queryByRole("button")).toBeNull();
      expect(lightboxProps.current).toBeNull();
    });

    it("opens the uncropped photo, alt naming the team, on click", async () => {
      render(<TeamHero {...BASE_SENIOR} {...PHOTO} />);
      // The viewer loads on the first click, not with the page.
      expect(lightboxProps.current).toBeNull();

      await userEvent.click(screen.getByRole("button"));

      await waitFor(() => expect(viewer()?.open).toBe(true));
      expect(viewer().slides).toEqual([
        { src: "/fixtures/ploeg-a-full.jpg", alt: "A-ploeg teamfoto" },
      ]);
    });

    it("closes on a backdrop click and shows no navigation for one photo", async () => {
      render(<TeamHero {...BASE_SENIOR} {...PHOTO} />);
      await userEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(viewer()?.open).toBe(true));

      expect(viewer().controller?.closeOnBackdropClick).toBe(true);
      expect(viewer().render?.buttonPrev?.()).toBeNull();
      expect(viewer().render?.buttonNext?.()).toBeNull();
    });

    it("closes when the viewer asks, and opens again on the next click", async () => {
      render(<TeamHero {...BASE_SENIOR} {...PHOTO} />);
      await userEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(viewer()?.open).toBe(true));

      act(() => viewer().close?.());
      expect(viewer().open).toBe(false);

      await userEvent.click(screen.getByRole("button"));
      expect(viewer().open).toBe(true);
      expect(trackEvent).toHaveBeenCalledTimes(2);
    });

    it("fires team_photo_open once per open, even on a double-click", async () => {
      render(<TeamHero {...BASE_SENIOR} {...PHOTO} />);

      await userEvent.dblClick(screen.getByRole("button"));

      expect(trackEvent).toHaveBeenCalledTimes(1);
      expect(trackEvent).toHaveBeenCalledWith("team_photo_open", {
        team_slug: "a-ploeg",
      });
    });
  });
});
