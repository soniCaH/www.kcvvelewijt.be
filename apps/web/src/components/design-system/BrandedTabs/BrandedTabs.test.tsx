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

  it("calls onTabChange with the clicked tab id", () => {
    const onTabChange = vi.fn();
    render(
      <BrandedTabs tabs={tabs} activeTabId="info" onTabChange={onTabChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Wedstrijden" }));
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
