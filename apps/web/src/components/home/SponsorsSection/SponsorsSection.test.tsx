/**
 * A failed sponsors read must degrade, not take the page down (#2505 round-3
 * review finding M1). `<SponsorsSection>` is mocked out of
 * `apps/web/src/app/(landing)/(home)/page.test.tsx` (it is an async Server
 * Component react-dom's `render()` cannot resolve below the root), which
 * left its own guard with no coverage anywhere — this file is that coverage.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

    await expect(SponsorsSection({})).resolves.toBeTruthy();
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

    const element = await SponsorsSection({});
    expect(element).toBeTruthy();
  });

  // The team page renders <SponsorsSection> with no tracker around it, and a
  // tile click there sends nothing today. Only the homepage call site wraps it
  // in <SponsorWallTracker> (#3649).
  it("sends no analytics event on a tile click without a wall tracker around it", async () => {
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

    const { container } = render(await SponsorsSection({}));
    const tile = container.querySelector<HTMLElement>("[data-sponsor-id]");
    expect(tile).not.toBeNull();
    await userEvent.click(tile!);

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
