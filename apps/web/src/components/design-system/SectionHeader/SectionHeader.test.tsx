// apps/web/src/components/design-system/SectionHeader/SectionHeader.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  describe("Title", () => {
    it("renders title text (auto-period appended via EditorialHeading)", () => {
      render(<SectionHeader title="Laatste nieuws" />);
      // EditorialHeading auto-appends a trailing period; assert via heading role.
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "Laatste nieuws.",
      );
    });

    it("renders as h2 by default", () => {
      render(<SectionHeader title="Nieuws" />);
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    });

    it("renders as the requested heading level", () => {
      render(<SectionHeader title="Nieuws" as="h3" />);
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });
  });

  describe("Kicker", () => {
    it("renders kicker labels via MonoLabelRow when provided", () => {
      render(
        <SectionHeader
          title="Het rooster"
          kicker={[{ label: "MATCHEN" }, { label: "A-PLOEG" }]}
        />,
      );
      expect(screen.getByText("MATCHEN")).toBeInTheDocument();
      expect(screen.getByText("A-PLOEG")).toBeInTheDocument();
    });

    it("does not render a kicker row when prop is omitted", () => {
      const { container } = render(<SectionHeader title="Nieuws" />);
      // No kicker row → no monolabel-row marker
      expect(container.querySelector("[data-divider-glyph]")).toBeNull();
    });
  });

  describe("Emphasis", () => {
    it("emphasis prop wraps the matched substring in <em>", () => {
      const { container } = render(
        <SectionHeader
          title="Het laatste nieuws"
          emphasis={{ text: "nieuws" }}
        />,
      );
      expect(container.querySelector("em")).not.toBeNull();
    });
  });

  describe("Link", () => {
    it("renders link when both linkText and linkHref provided", () => {
      render(
        <SectionHeader
          title="Nieuws"
          linkText="Alle berichten"
          linkHref="/nieuws"
        />,
      );
      const link = screen.getByRole("link", { name: /Alle berichten/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/nieuws");
    });

    it("does not render link when neither linkText nor linkHref are provided", () => {
      render(<SectionHeader title="Nieuws" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Variant", () => {
    it("light variant renders heading in ink tone (default)", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" variant="light" />,
      );
      expect(container.querySelector("h2")).toHaveAttribute("data-tone", "ink");
    });

    it("dark variant renders heading in cream tone", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" variant="dark" />,
      );
      expect(container.querySelector("h2")).toHaveAttribute(
        "data-tone",
        "cream",
      );
    });
  });

  describe("Custom className", () => {
    it("applies className to header element", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" className="mb-5" />,
      );
      expect(container.querySelector("header")).toHaveClass("mb-5");
    });
  });
});
