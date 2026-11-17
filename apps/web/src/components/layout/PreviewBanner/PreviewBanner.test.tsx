import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/nieuws/mijn-artikel",
}));

import { PreviewBanner } from "./PreviewBanner";

describe("PreviewBanner", () => {
  it("says the page is a preview of unpublished changes", () => {
    render(<PreviewBanner />);
    expect(
      screen.getByText(
        "Je bekijkt een voorbeeld met niet-gepubliceerde wijzigingen.",
      ),
    ).toBeInTheDocument();
  });

  it("links to the disable endpoint with the current path", () => {
    render(<PreviewBanner />);
    const link = screen.getByRole("link", { name: "Voorbeeld sluiten" });
    const href = new URL(link.getAttribute("href") ?? "", "https://x.test");
    expect(href.pathname).toBe("/api/preview/disable");
    expect(href.searchParams.get("sanity-preview-pathname")).toBe(
      "/nieuws/mijn-artikel",
    );
  });
});
