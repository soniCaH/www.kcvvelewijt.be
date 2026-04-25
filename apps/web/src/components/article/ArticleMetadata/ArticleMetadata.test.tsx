import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleMetadata } from "./ArticleMetadata";

const defaultProps = {
  author: "Redactie KCVV",
  date: "19.04.2026",
  readingTime: "4 min lezen",
  shareConfig: {
    url: "https://kcvvelewijt.be/nieuws/test",
  },
};

describe("ArticleMetadata", () => {
  it("renders the facts row in design order (date, author, reading time)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    const navText = (
      screen.getByRole("navigation", { name: "Artikelinfo" }).textContent ?? ""
    ).replace(/\s+/g, " ");
    expect(navText.indexOf("19.04.2026")).toBeGreaterThanOrEqual(0);
    expect(navText.indexOf("Redactie KCVV")).toBeGreaterThan(
      navText.indexOf("19.04.2026"),
    );
    expect(navText.indexOf("4 min lezen")).toBeGreaterThan(
      navText.indexOf("Redactie KCVV"),
    );
  });

  it("omits missing facts — shows only author when date and readingTime are empty", () => {
    render(<ArticleMetadata author="Redactie KCVV" />);
    const nav = screen.getByRole("navigation", { name: "Artikelinfo" });
    expect(nav).toHaveTextContent("Redactie KCVV");
    expect(nav.textContent ?? "").not.toContain("·");
  });

  it("renders a native share button and a Facebook share link when shareConfig is set", () => {
    render(<ArticleMetadata {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Delen" })).toBeInTheDocument();
    const facebookLink = screen.getByRole("link", {
      name: "Delen op Facebook",
    });
    expect(facebookLink).toHaveAttribute(
      "href",
      "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fkcvvelewijt.be%2Fnieuws%2Ftest",
    );
    expect(facebookLink).toHaveAttribute("target", "_blank");
  });

  it("does not render share cluster without shareConfig", () => {
    render(<ArticleMetadata author="Redactie KCVV" date="19.04.2026" />);
    expect(screen.queryByRole("button", { name: "Delen" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Delen op Facebook" }),
    ).toBeNull();
  });

  it("renders as a nav element with the metadata-bar label", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveAttribute("aria-label", "Artikelinfo");
  });

  it("applies border-y kcvv-gray-light so rules appear above AND below", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("border-y");
    expect(nav).toHaveClass("border-kcvv-gray-light");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleMetadata {...defaultProps} className="custom-metadata" />,
    );
    expect(container.querySelector("nav")).toHaveClass("custom-metadata");
  });

  it("falls back to the club default author when none is supplied", () => {
    // The four article templates all render the same implicit club author
    // until an editor-authored byline field lands. Defaulting inside
    // ArticleMetadata removes per-template `const AUTHOR = "KCVV Elewijt"`
    // duplication. See #1361 cross-template polish.
    render(
      <ArticleMetadata
        date="19.04.2026"
        readingTime="6 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Artikelinfo" });
    expect(nav).toHaveTextContent("KCVV Elewijt");
  });
});
