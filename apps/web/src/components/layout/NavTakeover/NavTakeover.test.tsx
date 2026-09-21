import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import Link from "next/link";
import { NavTakeover } from "./NavTakeover";
import { NavTakeoverItem } from "./NavTakeoverItem";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("NavTakeover", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <NavTakeover
        open={false}
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders dialog with wordmark + close button when open", () => {
    render(
      <NavTakeover open onOpenChange={() => {}} wordmark={<span>WM</span>}>
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("WM")).toBeInTheDocument();
    expect(screen.getByLabelText(/sluit menu/i)).toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(
      <NavTakeover open onOpenChange={() => {}} wordmark={<span>WM</span>}>
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <NavTakeover
        open={false}
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onOpenChange(false) when ✕ is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <NavTakeover open onOpenChange={onOpenChange} wordmark={<span>WM</span>}>
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    await user.click(screen.getByLabelText(/sluit menu/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(
      <NavTakeover open onOpenChange={onOpenChange} wordmark={<span>WM</span>}>
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("returns focus to the trigger when closed", () => {
    function Harness({ open }: { open: boolean }) {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} data-testid="trigger">
            open
          </button>
          <NavTakeover
            open={open}
            onOpenChange={() => {}}
            wordmark={<span>WM</span>}
            returnFocusRef={triggerRef}
          >
            <NavTakeoverItem label="Home" href="/" />
          </NavTakeover>
        </>
      );
    }
    const { rerender } = render(<Harness open />);
    rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(screen.getByTestId("trigger"));
  });

  it("does not steal focus on initial mount when open=false", () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} data-testid="trigger">
            open
          </button>
          <NavTakeover
            open={false}
            onOpenChange={() => {}}
            wordmark={<span>WM</span>}
            returnFocusRef={triggerRef}
          >
            <NavTakeoverItem label="Home" href="/" />
          </NavTakeover>
        </>
      );
    }
    render(<Harness />);
    expect(document.activeElement).not.toBe(screen.getByTestId("trigger"));
  });

  // #2850 — nothing retired the panel when the viewport grew past `lg` while
  // it was open, so it overlaid the desktop row. A fully controlled harness
  // (its own `open` state wired to `onOpenChange`) is required here, unlike
  // the fixed-prop tests above, because the fix drives its own close via
  // `onOpenChange` rather than waiting for the caller to change `open`.
  describe("closes itself when the viewport crosses into `lg` desktop layout", () => {
    // happy-dom's real `MediaQueryList`, under vitest's environment, does not
    // track `window.innerWidth` mutations — verified empirically while
    // building this test: `window.matchMedia("(min-width: 501px)").matches`
    // stayed `true` after setting `window.innerWidth = 500`, and firing a
    // `resize` event changed nothing. So — matching the existing
    // `window.matchMedia` mock in `CalendarWidget.test.tsx` — `window.matchMedia`
    // is stubbed here too, extended with a settable `matches` and a captured
    // `change` listener so a transition can actually be simulated via
    // `trigger()`, which the peer's static mock has no need for.
    function mockMatchMedia(initialMatches: boolean) {
      let currentMatches = initialMatches;
      const listeners = new Set<(event: { matches: boolean }) => void>();
      const mql = {
        get matches() {
          return currentMatches;
        },
        addEventListener: vi.fn(
          (type: string, cb: (event: { matches: boolean }) => void) => {
            if (type === "change") listeners.add(cb);
          },
        ),
        removeEventListener: vi.fn(
          (type: string, cb: (event: { matches: boolean }) => void) => {
            if (type === "change") listeners.delete(cb);
          },
        ),
      } as unknown as MediaQueryList;
      return {
        matchMedia: vi.fn().mockReturnValue(mql),
        trigger: (matches: boolean) => {
          currentMatches = matches;
          listeners.forEach((cb) => cb({ matches }));
        },
      };
    }

    // A custom (non-1024) breakpoint, read from the same custom property
    // `globals.css` defines — proves the value came off the DOM rather than
    // a hardcoded 1024 (#2850 AC4): a mock stubbed to answer for
    // "(min-width: 1024px)" would never be invoked by code asking for
    // "(min-width: 900px)", so `toHaveBeenCalledWith` below would fail.
    const TEST_BREAKPOINT_LG_PX = 900;

    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      document.documentElement.style.removeProperty("--breakpoint-lg");
    });

    function Harness() {
      const [open, setOpen] = useState(true);
      const triggerRef = useRef<HTMLButtonElement>(null);
      const desktopLinkRef = useRef<HTMLAnchorElement>(null);
      return (
        <>
          <button ref={triggerRef} data-testid="trigger">
            open
          </button>
          <Link ref={desktopLinkRef} href="/nieuws" data-testid="desktop-link">
            Nieuws
          </Link>
          <NavTakeover
            open={open}
            onOpenChange={setOpen}
            wordmark={<span>WM</span>}
            returnFocusRef={triggerRef}
            autoCloseFocusRef={desktopLinkRef}
          >
            <NavTakeoverItem label="Home" href="/" />
          </NavTakeover>
        </>
      );
    }

    it("retires the panel and moves focus to autoCloseFocusRef, not the now-hidden trigger, when the viewport crosses lg", () => {
      document.documentElement.style.setProperty(
        "--breakpoint-lg",
        `${TEST_BREAKPOINT_LG_PX}px`,
      );
      const { matchMedia, trigger } = mockMatchMedia(false);
      window.matchMedia = matchMedia;

      render(<Harness />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(matchMedia).toHaveBeenCalledWith(
        `(min-width: ${TEST_BREAKPOINT_LG_PX}px)`,
      );

      act(() => {
        trigger(true);
      });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId("desktop-link"));
    });

    it("leaves a manual close (Escape) unaffected — focus still returns to the trigger", () => {
      document.documentElement.style.setProperty(
        "--breakpoint-lg",
        `${TEST_BREAKPOINT_LG_PX}px`,
      );
      const { matchMedia } = mockMatchMedia(false);
      window.matchMedia = matchMedia;
      render(<Harness />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId("trigger"));
    });

    it("closes immediately on mount when the viewport is already at/above lg — no change event needed (e.g. a back/forward-cache restore)", () => {
      document.documentElement.style.setProperty(
        "--breakpoint-lg",
        `${TEST_BREAKPOINT_LG_PX}px`,
      );
      // Already matching the instant the panel subscribes — mirrors a page
      // restored from bfcache already at/above `lg` with the panel already
      // open (#2850 review finding F3). No `trigger()` call: a listener that
      // only reacted to a future `change` event would never fire here.
      const { matchMedia } = mockMatchMedia(true);
      window.matchMedia = matchMedia;

      render(<Harness />);

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId("desktop-link"));
    });

    it("does not install the auto-close listener when --breakpoint-lg can't be read — the drawer keeps its pre-fix behaviour", () => {
      // No --breakpoint-lg set — mirrors a test env with no stylesheet loaded.
      const matchMedia = vi.fn();
      window.matchMedia = matchMedia;

      render(<Harness />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(matchMedia).not.toHaveBeenCalled();
    });

    it("rejects a non-px unit the same way as an unreadable property, rather than mis-parsing its number", () => {
      // "64rem" would `parseFloat` to 64 — a breakpoint that would close the
      // drawer the instant it opens on every phone. Must be treated as
      // unknown, exactly like the empty-string case above.
      document.documentElement.style.setProperty("--breakpoint-lg", "64rem");
      const matchMedia = vi.fn();
      window.matchMedia = matchMedia;

      render(<Harness />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(matchMedia).not.toHaveBeenCalled();
    });
  });
});

describe("NavTakeoverItem", () => {
  it("renders a leaf link with the given href", () => {
    render(<NavTakeoverItem label="Home" href="/" />);
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("applies active jersey-deep tone", () => {
    render(<NavTakeoverItem label="Nieuws" href="/nieuws" active />);
    const link = screen.getByRole("link", { name: "Nieuws" });
    expect(link.className).toContain("text-jersey-deep");
  });

  it("marks the active row with aria-current, not colour alone", () => {
    const { rerender } = render(
      <NavTakeoverItem label="Nieuws" href="/nieuws" active />,
    );
    expect(screen.getByRole("link", { name: "Nieuws" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    rerender(<NavTakeoverItem label="Nieuws" href="/nieuws" />);
    expect(screen.getByRole("link", { name: "Nieuws" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
