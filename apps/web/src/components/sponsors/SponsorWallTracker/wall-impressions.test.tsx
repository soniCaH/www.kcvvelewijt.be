/**
 * Per-sponsor impressions (#3650): a tile counts once it was at least half
 * visible for a full second in a visible tab, once per Sponsor per page view,
 * linked or not. Rendered through the real hook, `hashMemberId` included, so
 * the raw id leaving the client would fail here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import { SponsorWallTracker } from "./SponsorWallTracker";

const mockTrackEvent = vi.mocked(trackEvent);

const setTabHidden = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

const seen = (el: Element, ratio = 0.5) =>
  act(() => {
    FakeIntersectionObserver.latest()!.trigger([
      { target: el, isIntersecting: true, intersectionRatio: ratio },
    ]);
  });
const left = (el: Element) =>
  act(() => {
    FakeIntersectionObserver.latest()!.trigger([
      { target: el, isIntersecting: false, intersectionRatio: 0 },
    ]);
  });
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

const impressions = () =>
  mockTrackEvent.mock.calls.filter(([name]) => name === "sponsor_impression");

describe("sponsor wall impressions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeIntersectionObserver.reset();
    mockTrackEvent.mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setTabHidden(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const renderWall = () =>
    render(
      <SponsorWallTracker source="homepage">
        <a
          href="https://a.example"
          data-sponsor-id="s-a"
          data-sponsor-tier="sponsor"
        >
          A
        </a>
        <div data-sponsor-id="s-b" data-sponsor-tier="sympathisant">
          B
        </div>
      </SponsorWallTracker>,
    );

  it("fires one hashed impression after 1 s at half visible", () => {
    renderWall();
    seen(screen.getByText("A"));
    wait(999);
    expect(impressions()).toHaveLength(0);
    wait(1);
    expect(impressions()).toHaveLength(1);
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_impression", {
      sponsor_id: hashMemberId("s-a"),
      tier: "sponsor",
      source: "homepage",
    });
    expect(JSON.stringify(mockTrackEvent.mock.calls)).not.toContain('"s-a"');
  });

  it("uses one observer at threshold 0.5 for every tile", () => {
    renderWall();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(FakeIntersectionObserver.latest()!.options?.threshold).toBe(0.5);
    expect(FakeIntersectionObserver.latest()!.observed).toHaveLength(2);
  });

  it("counts nothing for a tile that never reaches the viewport", () => {
    renderWall();
    wait(5000);
    expect(impressions()).toHaveLength(0);
  });

  it("ignores an entry that is only partly visible, below half", () => {
    renderWall();
    seen(screen.getByText("A"), 0.4);
    wait(2000);
    expect(impressions()).toHaveLength(0);
  });

  it("cancels the dwell when the tile leaves view before 1 s", () => {
    renderWall();
    seen(screen.getByText("A"));
    wait(600);
    left(screen.getByText("A"));
    wait(2000);
    expect(impressions()).toHaveLength(0);
  });

  it("counts an unlinked tile, and a click on it sends no click event", () => {
    renderWall();
    seen(screen.getByText("B"));
    wait(1000);
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_impression", {
      sponsor_id: hashMemberId("s-b"),
      tier: "sympathisant",
      source: "homepage",
    });
    fireEvent.click(screen.getByText("B"));
    expect(
      mockTrackEvent.mock.calls.filter(([name]) => name === "sponsor_click"),
    ).toHaveLength(0);
  });

  it("fires once per Sponsor per page view, however often it re-enters", () => {
    renderWall();
    seen(screen.getByText("A"));
    wait(1000);
    left(screen.getByText("A"));
    seen(screen.getByText("A"));
    wait(3000);
    expect(impressions()).toHaveLength(1);
  });

  it("counts a Sponsor shown twice on the wall once", () => {
    render(
      <SponsorWallTracker>
        <div data-sponsor-id="s-a">first</div>
        <div data-sponsor-id="s-a">second</div>
      </SponsorWallTracker>,
    );
    seen(screen.getByText("first"));
    seen(screen.getByText("second"));
    wait(1000);
    expect(impressions()).toHaveLength(1);
  });

  it("counts nothing while the tab is hidden", () => {
    renderWall();
    setTabHidden(true);
    seen(screen.getByText("A"));
    wait(5000);
    expect(impressions()).toHaveLength(0);
  });

  it("restarts the dwell when the tab becomes visible again", () => {
    renderWall();
    seen(screen.getByText("A"));
    wait(600);
    setTabHidden(true);
    wait(5000);
    expect(impressions()).toHaveLength(0);
    setTabHidden(false);
    wait(999);
    expect(impressions()).toHaveLength(0);
    wait(1);
    expect(impressions()).toHaveLength(1);
  });

  it("starts the dwell for a tile seen while hidden once the tab shows", () => {
    renderWall();
    setTabHidden(true);
    seen(screen.getByText("A"));
    setTabHidden(false);
    wait(1000);
    expect(impressions()).toHaveLength(1);
  });

  it("drops a pending dwell on unmount", () => {
    const { unmount } = renderWall();
    seen(screen.getByText("A"));
    unmount();
    wait(2000);
    expect(impressions()).toHaveLength(0);
  });

  it("is a no-op without IntersectionObserver", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(() => renderWall()).not.toThrow();
  });
});
