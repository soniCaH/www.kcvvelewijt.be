import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { NavDropdown, NavDropdownProvider } from "./NavDropdown";
import type { NavDropdownGroup, NavDropdownItem } from "./NavDropdown";

const mockPathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.current,
}));

const teamsItems: NavDropdownItem[] = [
  { label: "Info", href: "/ploegen/a" },
  { label: "Spelers & Staff", href: "/ploegen/a?tab=opstelling" },
  { label: "Wedstrijden", href: "/ploegen/a?tab=wedstrijden" },
  { label: "Stand", href: "/ploegen/a?tab=klassement" },
];

const deClubGroups: NavDropdownGroup[] = [
  {
    label: "Wie we zijn",
    items: [
      { label: "Geschiedenis", href: "/club/geschiedenis" },
      { label: "Organigram", href: "/club/organigram" },
    ],
  },
  {
    label: "Praktisch",
    items: [{ label: "Contact", href: "/club/contact" }],
  },
];

const renderTrigger = (
  props: Partial<React.ComponentProps<typeof NavDropdown>> = {},
) =>
  render(
    <ul>
      <NavDropdown
        label="A-Ploeg"
        href="/ploegen/a"
        items={teamsItems}
        {...props}
      />
    </ul>,
  );

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockPathname.current = "/";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NavDropdown — render", () => {
  it("renders the trigger with the given label and ▾ glyph", () => {
    renderTrigger();
    const trigger = screen.getByRole("link", { name: /a-ploeg/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("does not render the panel by default", () => {
    renderTrigger();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("NavDropdown — hover-grace timing", () => {
  it("opens after the 80ms open grace", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
    });
    expect(screen.queryByRole("menu")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(79);
    });
    expect(screen.queryByRole("menu")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("does not open if the cursor leaves before the 80ms grace expires", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(50);
      fireEvent.mouseLeave(li);
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes after the 200ms close grace on mouseLeave", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(li);
      vi.advanceTimersByTime(199);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("re-hovering within close grace cancels the pending close (no flicker)", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(li);
      vi.advanceTimersByTime(150);
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});

describe("NavDropdown — cross-panel coordination", () => {
  it("opening panel B closes panel A immediately (skips A's close grace)", () => {
    render(
      <NavDropdownProvider>
        <ul>
          <NavDropdown
            id="a"
            label="A-Ploeg"
            href="/ploegen/a"
            items={teamsItems}
          />
          <NavDropdown
            id="b"
            label="De club"
            href="/club"
            itemGroups={deClubGroups}
          />
        </ul>
      </NavDropdownProvider>,
    );

    const liA = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    const liB = screen.getByRole("link", { name: /de club/i }).closest("li")!;

    // Open A.
    act(() => {
      fireEvent.mouseEnter(liA);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu", { name: /a-ploeg/i })).toBeInTheDocument();

    // Hover B without waiting for A's close grace.
    act(() => {
      fireEvent.mouseLeave(liA);
      fireEvent.mouseEnter(liB);
      vi.advanceTimersByTime(80);
    });

    // B should be open; A should already be closed.
    expect(screen.queryByRole("menu", { name: /a-ploeg/i })).toBeNull();
    expect(screen.getByRole("menu", { name: /de club/i })).toBeInTheDocument();

    // Advance past A's stale 200ms close-grace timer — the functional update
    // guard in `closeImmediately`/`scheduleClose` must keep B open even when
    // A's pending close-timer fires.
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByRole("menu", { name: /de club/i })).toBeInTheDocument();
  });
});

describe("NavDropdown — close paths", () => {
  it("Escape closes the panel and refocuses the trigger", () => {
    renderTrigger();
    const trigger = screen.getByRole("link", { name: /a-ploeg/i });
    const li = trigger.closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("pointerdown outside trigger + panel closes the panel", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      fireEvent.pointerDown(document.body);
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("pointerdown inside the panel does NOT close it", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    const panel = screen.getByRole("menu");

    act(() => {
      fireEvent.pointerDown(panel);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("pathname change closes the panel", () => {
    const { rerender } = renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;

    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();

    act(() => {
      mockPathname.current = "/nieuws";
      rerender(
        <ul>
          <NavDropdown label="A-Ploeg" href="/ploegen/a" items={teamsItems} />
        </ul>,
      );
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("NavDropdown — keyboard navigation", () => {
  it("ArrowDown on the trigger opens the panel and focuses the first item", () => {
    renderTrigger();
    const trigger = screen.getByRole("link", { name: /a-ploeg/i });

    act(() => {
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    // Focus moves via requestAnimationFrame; flush by advancing time.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toBeDefined();
    expect(document.activeElement).toBe(items[0]);
  });

  it("Enter on the trigger opens the panel instantly (no grace)", () => {
    renderTrigger();
    const trigger = screen.getByRole("link", { name: /a-ploeg/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("ArrowDown inside the panel cycles focus through items", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    const items = screen.getAllByRole("menuitem");
    items[0]!.focus();
    act(() => {
      fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    });
    expect(document.activeElement).toBe(items[1]);
  });

  it("Tab past the last menuitem closes the panel", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    const items = screen.getAllByRole("menuitem");
    items[items.length - 1]!.focus();
    act(() => {
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab" });
      // Close is deferred via setTimeout(0) so the browser can advance focus
      // before unmount; flush the deferred call.
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("Shift+Tab past the first menuitem closes the panel", () => {
    renderTrigger();
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    const items = screen.getAllByRole("menuitem");
    items[0]!.focus();
    act(() => {
      fireEvent.keyDown(screen.getByRole("menu"), {
        key: "Tab",
        shiftKey: true,
      });
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("NavDropdown — active state", () => {
  it("renders ▶ chevron + aria-current on the active item", () => {
    renderTrigger({
      items: [
        { label: "Info", href: "/ploegen/a" },
        { label: "Stand", href: "/ploegen/a?tab=klassement", active: true },
      ],
    });
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    const stand = screen.getByRole("menuitem", { name: /stand/i });
    expect(stand).toHaveAttribute("aria-current", "page");
    expect(stand.textContent).toContain("▶");
  });

  it("inactive items render — em-dash bullet, not ▶", () => {
    renderTrigger({
      items: [{ label: "Info", href: "/ploegen/a" }],
    });
    const li = screen.getByRole("link", { name: /a-ploeg/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    const info = screen.getByRole("menuitem", { name: /info/i });
    expect(info).not.toHaveAttribute("aria-current");
    expect(info.textContent).toContain("—");
    expect(info.textContent).not.toContain("▶");
  });
});

describe("NavDropdown — wide / grouped layout", () => {
  it("renders group headings when itemGroups is provided", () => {
    render(
      <ul>
        <NavDropdown label="De club" href="/club" itemGroups={deClubGroups} />
      </ul>,
    );
    const li = screen.getByRole("link", { name: /de club/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    expect(screen.getByText("Wie we zijn")).toBeInTheDocument();
    expect(screen.getByText("Praktisch")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /geschiedenis/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /contact/i }),
    ).toBeInTheDocument();
  });

  it("itemGroups takes precedence over items when both are passed", () => {
    render(
      <ul>
        <NavDropdown
          label="Both"
          href="/x"
          items={[{ label: "from-items", href: "/i" }]}
          itemGroups={[
            { label: "G", items: [{ label: "from-groups", href: "/g" }] },
          ]}
        />
      </ul>,
    );
    const li = screen.getByRole("link", { name: /both/i }).closest("li")!;
    act(() => {
      fireEvent.mouseEnter(li);
      vi.advanceTimersByTime(80);
    });

    expect(screen.queryByRole("menuitem", { name: /from-items/i })).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: /from-groups/i }),
    ).toBeInTheDocument();
  });
});

describe("NavDropdownProvider", () => {
  it("defaultOpenId pre-opens the matching dropdown", () => {
    render(
      <NavDropdownProvider defaultOpenId="x">
        <ul>
          <NavDropdown
            id="x"
            label="A-Ploeg"
            href="/ploegen/a"
            items={teamsItems}
          />
        </ul>
      </NavDropdownProvider>,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
