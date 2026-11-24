import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { PackageExplainer } from "./PackageExplainer";

const text = (el: HTMLElement) => el.textContent ?? "";

describe("PackageExplainer", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.mocked(trackEvent).mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the heading", () => {
    render(<PackageExplainer />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Wat krijgt een partner/ }),
    ).toBeInTheDocument();
  });

  it("renders no euro amount at all", () => {
    const { container } = render(<PackageExplainer contactName="An Peeters" />);
    expect(text(container)).not.toMatch(/€|\beur\b|\beuro\b|\bbtw\b/i);
  });

  it("has no matchbal or onderleggers entry", () => {
    const { container } = render(<PackageExplainer />);
    expect(text(container)).not.toMatch(/matchbal|onderlegger/i);
  });

  it("names no tier", () => {
    const { container } = render(<PackageExplainer contactName="An Peeters" />);
    expect(text(container)).not.toMatch(/hoofdsponsor|sympathisant/i);
    expect(text(container)).not.toMatch(/\btier\b/i);
  });

  it("lists team support and the season overview without a price", () => {
    render(<PackageExplainer />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const team = items.find((li) => text(li).includes("Een ploeg steunen"))!;
    const season = items.find((li) => text(li).includes("Na elk seizoen"))!;
    expect(text(team)).toContain("Je naam op de pagina van die ploeg.");
    expect(text(season)).toContain("Een overzicht van wat je logo bereikte.");
    expect(text(team)).not.toContain("€");
    expect(text(season)).not.toContain("€");
  });

  it("shows the contact role and address, no name by default", () => {
    render(<PackageExplainer />);
    expect(
      screen.getByText("Verantwoordelijke Sponsoring"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "sponsoring@kcvvelewijt.be" }),
    ).toHaveAttribute("href", "mailto:sponsoring@kcvvelewijt.be");
    expect(screen.queryByText("An Peeters")).not.toBeInTheDocument();
  });

  it("marks the address link for the contact click", () => {
    render(<PackageExplainer />);
    expect(
      screen.getByRole("link", { name: "sponsoring@kcvvelewijt.be" }),
    ).toHaveAttribute("data-sponsor-contact");
  });

  it("shows the contact person's name when one is passed", () => {
    render(<PackageExplainer contactName="An Peeters" />);
    expect(screen.getByText("An Peeters")).toBeInTheDocument();
    expect(
      screen.getByText("Verantwoordelijke Sponsoring"),
    ).toBeInTheDocument();
  });

  it("fires sponsor_packages_view at 40% in view, once", () => {
    render(<PackageExplainer />);
    const observer = FakeIntersectionObserver.latest()!;
    expect(observer.options?.threshold).toBe(0.4);
    expect(trackEvent).not.toHaveBeenCalled();
    act(() => {
      observer.trigger([{ isIntersecting: true }]);
      observer.trigger([{ isIntersecting: true }]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("sponsor_packages_view", undefined);
  });
});
