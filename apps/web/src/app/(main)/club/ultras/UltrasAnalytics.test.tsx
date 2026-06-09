import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UltrasAnalytics } from "./UltrasAnalytics";

describe("UltrasAnalytics", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  afterEach(() => {
    delete window.dataLayer;
  });

  const events = () =>
    (window.dataLayer ?? []).map((e) => (e as Record<string, unknown>).event);

  it("renders its children", () => {
    render(
      <UltrasAnalytics>
        <div data-testid="child">Hi</div>
      </UltrasAnalytics>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("fires ultras_view once on mount", () => {
    render(
      <UltrasAnalytics>
        <div />
      </UltrasAnalytics>,
    );
    expect(events().filter((e) => e === "ultras_view")).toHaveLength(1);
  });

  it("fires ultras_join_click when a [data-ultras-join] element is clicked", () => {
    render(
      <UltrasAnalytics>
        <a href="#" data-ultras-join data-testid="join">
          Word lid
        </a>
      </UltrasAnalytics>,
    );

    fireEvent.click(screen.getByTestId("join"));
    expect(events().filter((e) => e === "ultras_join_click")).toHaveLength(1);
  });

  it("does not fire ultras_join_click for unrelated clicks", () => {
    render(
      <UltrasAnalytics>
        <a href="#" data-testid="other">
          Iets anders
        </a>
      </UltrasAnalytics>,
    );

    fireEvent.click(screen.getByTestId("other"));
    expect(events()).not.toContain("ultras_join_click");
  });
});
