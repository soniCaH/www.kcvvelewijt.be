/**
 * A failed sponsors read must degrade, not take the page down (#2505 round-3
 * review finding M1). `<SponsorsSection>` is mocked out of
 * `apps/web/src/app/(landing)/(home)/page.test.tsx` (it is an async Server
 * Component react-dom's `render()` cannot resolve below the root), which
 * left its own guard with no coverage anywhere — this file is that coverage.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { hashMemberId } from "@/lib/analytics/hash-member-id";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

const { mockFindAll } = vi.hoisted(() => ({ mockFindAll: vi.fn() }));

vi.mock("@/lib/repositories/sponsor.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/sponsor.repository")
    >();
  return {
    ...mod,
    SponsorRepositoryLive: Layer.succeed(mod.SponsorRepository, {
      findAll: mockFindAll,
    }),
  };
});

// Imported at module scope — see CLAUDE.md "Import the module under test at
// module scope".
const { SponsorsSection } = await import("./SponsorsSection");
const { trackEvent: mockTrackEvent } =
  await import("@/lib/analytics/track-event");

describe("SponsorsSection", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("survives a sponsors read that dies (real Sanity defect shape) instead of rejecting", async () => {
    mockFindAll.mockReturnValue(Effect.die(new Error("Sanity is unreachable")));

    await expect(SponsorsSection({ source: "team" })).resolves.toBeTruthy();
  });

  it("still renders sponsors when the read succeeds", async () => {
    mockFindAll.mockReturnValue(
      Effect.succeed([
        {
          id: "s1",
          name: "Hoofdsponsor BV",
          logoUrl: "https://cdn.example.com/logo.png",
          url: "https://example.com",
          tier: "hoofdsponsor" as const,
          type: null,
        },
      ]),
    );

    const element = await SponsorsSection({ source: "team" });
    expect(element).toBeTruthy();
  });

  // The section owns its wall tracker and sends its surface on every event, so
  // the team page's wall reports like the homepage's (#3651).
  describe.each(["team", "homepage"] as const)(
    "on the %s surface",
    (source) => {
      const sponsor = {
        id: "s1",
        name: "Hoofdsponsor BV",
        logoUrl: "https://cdn.example.com/logo.png",
        url: "https://example.com",
        tier: "hoofdsponsor" as const,
        type: null,
      };

      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        FakeIntersectionObserver.reset();
        vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
        vi.mocked(mockTrackEvent).mockClear();
        mockFindAll.mockReturnValue(Effect.succeed([sponsor]));
      });

      afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
      });

      it("sends sponsor_click with the surface", async () => {
        const { container } = render(await SponsorsSection({ source }));
        const tile = container.querySelector<HTMLElement>("[data-sponsor-id]");
        expect(tile).not.toBeNull();
        await userEvent.click(tile!);

        expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
          sponsor_id: hashMemberId("s1"),
          tier: "hoofdsponsor",
          source,
        });
      });

      it("sends sponsor_impression with the surface after 1 s in view", async () => {
        const { container } = render(await SponsorsSection({ source }));
        const tile = container.querySelector<HTMLElement>("[data-sponsor-id]");
        act(() => {
          FakeIntersectionObserver.latest()!.trigger([
            { target: tile!, isIntersecting: true, intersectionRatio: 1 },
          ]);
        });
        act(() => void vi.advanceTimersByTime(1000));

        expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_impression", {
          sponsor_id: hashMemberId("s1"),
          tier: "hoofdsponsor",
          source,
        });
      });
    },
  );
});
