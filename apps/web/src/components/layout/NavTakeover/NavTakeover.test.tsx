import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    const ORIGINAL_INNER_WIDTH = window.innerWidth;

    afterEach(() => {
      window.innerWidth = ORIGINAL_INNER_WIDTH;
      document.documentElement.style.removeProperty("--breakpoint-lg");
    });

    // A custom (non-1024) breakpoint, read from the same custom property
    // `globals.css` defines — the crossing width below (1000px) sits
    // BETWEEN this value and the real 1024px default, so the assertion only
    // passes if the component actually read 900px off the DOM rather than a
    // hardcoded 1024 (#2850 AC4).
    const TEST_BREAKPOINT_LG_PX = 900;

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

    it("retires the panel and moves focus to autoCloseFocusRef, not the now-hidden trigger", () => {
      document.documentElement.style.setProperty(
        "--breakpoint-lg",
        `${TEST_BREAKPOINT_LG_PX}px`,
      );
      window.innerWidth = 500;
      render(<Harness />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      window.innerWidth = 1000;
      fireEvent(window, new Event("resize"));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId("desktop-link"));
    });

    it("leaves a manual close (Escape) unaffected — focus still returns to the trigger", () => {
      document.documentElement.style.setProperty(
        "--breakpoint-lg",
        `${TEST_BREAKPOINT_LG_PX}px`,
      );
      window.innerWidth = 500;
      render(<Harness />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(screen.getByTestId("trigger"));
    });

    it("falls back to the real --breakpoint-lg default (1024px) when the custom property can't be read", () => {
      // No --breakpoint-lg set — mirrors a test env with no stylesheet loaded.
      window.innerWidth = 500;
      render(<Harness />);

      window.innerWidth = 1200;
      fireEvent(window, new Event("resize"));

      expect(screen.queryByRole("dialog")).toBeNull();
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
