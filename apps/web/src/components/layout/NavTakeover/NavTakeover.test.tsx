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
  it("stays mounted but hidden and inert when closed (so it can fade out)", () => {
    render(
      <NavTakeover
        open={false}
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    const panel = document.getElementById("nav-takeover");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("hidden");
    expect(panel).toHaveAttribute("inert");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is neither hidden nor inert when open", () => {
    render(
      <NavTakeover
        open
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("inert");
  });

  it("renders dialog with wordmark + close button when open", () => {
    render(
      <NavTakeover
        open
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("WM")).toBeInTheDocument();
    expect(screen.getByLabelText(/sluit menu/i)).toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(
      <NavTakeover
        open
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <NavTakeover
        open={false}
        onOpenChange={() => {}}
        wordmark={<span>WM</span>}
        rowCount={1}
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
      <NavTakeover
        open
        onOpenChange={onOpenChange}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
        <NavTakeoverItem label="Home" href="/" />
      </NavTakeover>,
    );
    await user.click(screen.getByLabelText(/sluit menu/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(
      <NavTakeover
        open
        onOpenChange={onOpenChange}
        wordmark={<span>WM</span>}
        rowCount={1}
      >
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
            rowCount={1}
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
            rowCount={1}
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
    // A bare `window.innerWidth = 500` never reaches happy-dom: Vitest's
    // window shim keeps the value, so `matchMedia` stays on the old viewport
    // (#3142 — `window.happyDOM.setViewport` is the write that works, and
    // the lint config now bans the bare one). This stub predates that
    // finding. So — matching the existing
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
            rowCount={1}
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

  describe("row rules (#3392)", () => {
    // Renders a menu of `rows` rows and returns the nav's `--rule-count` plus
    // each row's `--rule-index` — the two inputs of the CSS delay.
    const renderMenu = (rows: number) => {
      render(
        <NavTakeover
          open
          onOpenChange={() => {}}
          wordmark={<span>WM</span>}
          rowCount={rows}
        >
          {Array.from({ length: rows }, (_, i) => (
            <NavTakeoverItem
              key={i}
              label={`Rij ${i}`}
              href={`/rij-${i}`}
              index={i}
            />
          ))}
        </NavTakeover>,
      );
      const nav = screen.getByRole("navigation", { name: "Hoofdnavigatie" });
      return {
        count: nav.style.getPropertyValue("--rule-count"),
        indexes: screen
          .getAllByRole("link")
          .map((a) => a.style.getPropertyValue("--rule-index")),
      };
    };

    // The delay is `index × min(30ms, 270ms / max(count − 1, 1))`, evaluated by
    // the browser from the rendered custom properties and the class below
    // (the story's `play` reads the computed value in a real browser).
    const delayMs = (count: string, index: string) =>
      Number(index) * Math.min(30, 270 / Math.max(Number(count) - 1, 1));

    it("9 rows: step 30ms, the last rule starts at 240ms", () => {
      const { count, indexes } = renderMenu(9);
      expect(count).toBe("9");
      expect(indexes).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
      expect(delayMs(count, indexes[1])).toBe(30);
      expect(delayMs(count, indexes[8])).toBe(240);
    });

    it("12 rows: the step shrinks to 270/11ms, the last rule starts at exactly the 270ms cap", () => {
      const { count, indexes } = renderMenu(12);
      expect(count).toBe("12");
      expect(indexes[11]).toBe("11");
      expect(delayMs(count, indexes[1])).toBe(270 / 11);
      expect(delayMs(count, indexes[11])).toBe(270);
    });

    it("computes that delay in the row's ::after class — the same formula as the test", () => {
      render(<NavTakeoverItem label="Nieuws" href="/nieuws" index={1} />);
      expect(screen.getByRole("link", { name: /Nieuws/ })).toHaveClass(
        "after:delay-[calc(var(--rule-index,0)*min(30ms,270ms/max(var(--rule-count,1)_-_1,1)))]",
      );
    });

    it("draws the rule on a pseudo-element and never gates the row itself", () => {
      render(<NavTakeoverItem label="Nieuws" href="/nieuws" index={1} />);
      const link = screen.getByRole("link", { name: /Nieuws/ });
      // The old hairline was `border-b border-paper-edge`; it stays in the box
      // (transparent) so the row height is unchanged, and the ::after paints it.
      expect(link).toHaveClass("border-b", "border-transparent");
      expect(link).not.toHaveClass("border-paper-edge");
      expect(link).toHaveClass("after:bg-paper-edge", "after:origin-left");
      // Draw: the CSS `scale` property (not `transform`), from zero, at Arrival speed.
      expect(link).toHaveClass(
        "after:starting:scale-x-0",
        "after:transition-[scale]",
        "after:duration-500",
        "after:ease-out",
        "motion-reduce:after:transition-none",
      );
      // Decoration only: nothing on the row's text or pointer handling moves.
      expect(link.className).not.toMatch(/pointer-events|opacity/);
    });
  });
});
