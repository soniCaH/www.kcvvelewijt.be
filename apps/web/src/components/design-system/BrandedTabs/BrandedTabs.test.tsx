import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrandedTabs, type BrandedTab } from "./BrandedTabs";

const tabs: BrandedTab[] = [
  { id: "info", label: "Info" },
  { id: "spelers", label: "Spelers" },
  { id: "wedstrijden", label: "Wedstrijden" },
];

describe("BrandedTabs", () => {
  it("renders all tab labels as tab role buttons", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    tabs.forEach((tab) => {
      expect(screen.getByRole("tab", { name: tab.label })).toBeInTheDocument();
    });
  });

  it("marks the active tab with aria-selected and tabIndex 0", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="spelers" onTabChange={() => {}} />,
    );
    const active = screen.getByRole("tab", { name: "Spelers" });
    expect(active).toHaveAttribute("aria-selected", "true");
    expect(active).toHaveAttribute("tabindex", "0");
  });

  it("highlights the active tab with the green bottom border classes", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="spelers" onTabChange={() => {}} />,
    );
    const active = screen.getByRole("tab", { name: "Spelers" });
    expect(active).toHaveClass("border-kcvv-green-bright");
    expect(active).toHaveClass("text-kcvv-green-dark");
  });

  it("renders inactive tabs with transparent border and gray text", () => {
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={() => {}} />,
    );
    const inactive = screen.getByRole("tab", { name: "Spelers" });
    expect(inactive).toHaveClass("border-transparent");
    expect(inactive).toHaveClass("text-kcvv-gray");
    expect(inactive).toHaveAttribute("aria-selected", "false");
    expect(inactive).toHaveAttribute("tabindex", "-1");
  });

  it("calls onTabChange exactly once with the clicked tab id", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Wedstrijden" }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
  });

  it("does not call onTabChange when clicking the already-active tab", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Info" }));
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("moves selection right with ArrowRight and updates tabIndex", () => {
    const onTabChange = vi.fn();
    const { rerender } = render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    const info = screen.getByRole("tab", { name: "Info" });
    fireEvent.keyDown(info, { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith("spelers");

    rerender(
      <BrandedTabs
        tabs={tabs}
        activeTabId="spelers"
        onTabChange={onTabChange}
      />,
    );
    const spelers = screen.getByRole("tab", { name: "Spelers" });
    expect(spelers).toHaveAttribute("tabindex", "0");
    expect(spelers).toHaveAttribute("aria-selected", "true");
    expect(info).toHaveAttribute("tabindex", "-1");
    expect(info).toHaveAttribute("aria-selected", "false");
  });

  it("moves selection left with ArrowLeft and wraps around", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    const info = screen.getByRole("tab", { name: "Info" });
    fireEvent.keyDown(info, { key: "ArrowLeft" });
    expect(onTabChange).toHaveBeenCalledWith("wedstrijden");
  });

  it("exposes a tablist with the configured aria-label", () => {
    render(
      <BrandedTabs
        tabs={tabs}
        activeTabId="info"
        onTabChange={() => {}}
        ariaLabel="Team detail secties"
      />,
    );
    expect(
      screen.getByRole("tablist", { name: "Team detail secties" }),
    ).toBeInTheDocument();
  });
});
