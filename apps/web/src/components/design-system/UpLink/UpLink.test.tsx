import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPathname = vi.fn<() => string>(() => "/nieuws/een-artikel");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { UpLink } from "./UpLink";

describe("UpLink", () => {
  beforeEach(() => {
    window.dataLayer = [];
    mockPathname.mockReturnValue("/nieuws/een-artikel");
  });

  it("renders the bare parent name with a link to the parent route", () => {
    render(<UpLink href="/nieuws" label="Nieuws" />);
    const link = screen.getByRole("link", { name: "Nieuws" });
    expect(link).toHaveAttribute("href", "/nieuws");
  });

  it("never renders a 'terug naar' promise — the bare parent name only", () => {
    render(<UpLink href="/nieuws" label="Nieuws" />);
    expect(screen.getByTestId("up-link")).toHaveTextContent(/^Nieuws$/);
  });

  it("defaults to the ink tone", () => {
    render(<UpLink href="/nieuws" label="Nieuws" />);
    expect(screen.getByTestId("up-link")).toHaveAttribute("data-tone", "ink");
  });

  it("switches to the cream tone for the dark register", () => {
    render(<UpLink href="/club" label="De club" tone="cream" />);
    expect(screen.getByTestId("up-link")).toHaveAttribute("data-tone", "cream");
  });

  it("fires nav_parent_click with the source route and the parent href on click", async () => {
    const user = userEvent.setup();
    render(<UpLink href="/kalender" label="Kalender" />);

    await user.click(screen.getByRole("link", { name: "Kalender" }));

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({
      event: "nav_parent_click",
      // Reuses the already-registered `page_slug` dimension, not a new
      // `path` key (review round 2, #2570).
      page_slug: "/nieuws/een-artikel",
      destination: "/kalender",
    });
  });

  it("carries its own 48px/64px top air on the ink tone (#2877)", () => {
    render(<UpLink href="/nieuws" label="Nieuws" />);
    expect(screen.getByTestId("up-link").className).toContain("mt-12");
    expect(screen.getByTestId("up-link").className).toContain("lg:mt-16");
  });

  it("gains no top air on the cream tone — the dark band's own padding is the air (#2877)", () => {
    render(<UpLink href="/club" label="De club" tone="cream" />);
    const className = screen.getByTestId("up-link").className;
    expect(className).not.toContain("mt-12");
    expect(className).not.toContain("lg:mt-16");
  });

  it("shows a visible focus ring on keyboard focus, per tone", () => {
    const { rerender } = render(<UpLink href="/nieuws" label="Nieuws" />);
    expect(screen.getByTestId("up-link").className).toContain(
      "focus-visible:outline-jersey-deep",
    );

    rerender(<UpLink href="/club" label="De club" tone="cream" />);
    expect(screen.getByTestId("up-link").className).toContain(
      "focus-visible:outline-warm",
    );
  });
});
