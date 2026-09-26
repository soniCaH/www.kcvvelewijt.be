// apps/web/src/components/design-system/SectionHeader/SectionHeader.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionHeader, type SectionHeaderProps } from "./SectionHeader";

// Type-level assertion (D10/S2 size restriction) — TypeScript, not
// vitest, is what's under test here. `@ts-expect-error` fails the *type
// check* if the flagged line stops being an error (i.e. if `ruled: true`
// and a non-default `size` ever become a legal pair again), which is what
// makes the D10 evidence's single-size restriction a compile error at the
// call site rather than a convention nothing enforces. Bare const
// declaration — no runtime behavior is under test.
const _ruledWithNonDefaultSize: SectionHeaderProps = {
  title: "Nieuws",
  ruled: true,
  // @ts-expect-error — `ruled: true` restricts `size` to the default
  // (display-lg); D10 shows no other size paired with the ruled variant.
  size: "display-sm",
};
void _ruledWithNonDefaultSize;

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
      expect(
        container.querySelector('[data-testid="section-header"]'),
      ).toHaveClass("mb-5");
    });
  });

  describe("Ruled variant", () => {
    it("does not render ruled markup by default", () => {
      const { container } = render(<SectionHeader title="Nieuws" />);
      expect(
        container.querySelector('[data-testid="section-header"]'),
      ).not.toHaveAttribute("data-ruled");
    });

    it("renders hairlines flanking the title when ruled and within the length limit", () => {
      const { container } = render(
        <SectionHeader title="Negentien ploegen, van U6 tot U21" ruled />,
      );
      const header = container.querySelector('[data-testid="section-header"]');
      expect(header).toHaveAttribute("data-ruled", "true");
      // Centring only activates from the `lg` breakpoint — see
      // RULED_TITLE_MAX_LENGTH's doc comment for why a bare (unprefixed)
      // items-center/text-center would slice a rule through a heading
      // that wraps to two lines below `lg`.
      expect(header).toHaveClass("lg:items-center", "lg:text-center");
      // Heading flanked by exactly two hairline spans in the same row.
      const row = screen.getByRole("heading").parentElement;
      expect(row?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    });

    it("hides the hairlines below the lg breakpoint and shows them from it", () => {
      const { container } = render(
        <SectionHeader title="Negentien ploegen, van U6 tot U21" ruled />,
      );
      const hairline = container.querySelector('[aria-hidden="true"]');
      expect(hairline).toHaveClass("hidden", "lg:block");
    });

    it("centres a title exactly at the length limit (boundary: 40 chars)", () => {
      const boundaryTitle = "a".repeat(40);
      const { container } = render(
        <SectionHeader title={boundaryTitle} ruled />,
      );
      expect(
        container.querySelector('[data-testid="section-header"]'),
      ).toHaveAttribute("data-ruled", "true");
    });

    it("falls back to the default layout one character past the length limit (boundary: 41 chars)", () => {
      const tooLongTitle = "a".repeat(41);
      const { container } = render(
        <SectionHeader title={tooLongTitle} ruled />,
      );
      expect(
        container.querySelector('[data-testid="section-header"]'),
      ).not.toHaveAttribute("data-ruled");
      expect(
        container.querySelector('[data-testid="section-header"]'),
      ).not.toHaveClass("lg:items-center");
    });

    it("warns in development when a too-long title requests the ruled treatment", () => {
      vi.stubEnv("NODE_ENV", "development");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<SectionHeader title={"a".repeat(41)} ruled />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("ruled treatment ignored"),
      );
      warnSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it("does not warn when ruled is requested within the length limit", () => {
      vi.stubEnv("NODE_ENV", "development");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<SectionHeader title="Nieuws" ruled />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it("keeps a ruled header's link beside the heading below lg, and reflows it onto its own line at lg", () => {
      render(
        <SectionHeader
          title="Nieuws"
          ruled
          linkText="Alle berichten"
          linkHref="/nieuws"
        />,
      );
      const link = screen.getByRole("link", { name: /Alle berichten/i });
      const row = screen.getByRole("heading").parentElement;
      // Below `lg` the hairlines are `display: none`, so the CTA has to sit
      // in the same row as the heading or a ruled header would stack its
      // link where the default treatment ranges it alongside.
      expect(row?.contains(link)).toBe(true);
      // At `lg` that single row reflows: the CTA takes a full basis, which
      // pushes it onto its own centred line under the ruled row.
      expect(link.parentElement).toHaveClass("lg:basis-full", "lg:text-center");
    });

    it("renders a ruled header's link exactly once", () => {
      render(
        <SectionHeader
          title="Nieuws"
          ruled
          linkText="Alle berichten"
          linkHref="/nieuws"
        />,
      );
      // A responsive layout must not ship two copies of the same link — a
      // second one behind a `hidden` utility is still in the tab order.
      expect(
        screen.getAllByRole("link", { name: /Alle berichten/i }),
      ).toHaveLength(1);
    });

    it("draws cream hairlines on the dark variant", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" ruled variant="dark" />,
      );
      const hairline = container.querySelector('[aria-hidden="true"]');
      expect(hairline).toHaveClass("bg-cream");
    });

    it("draws ink hairlines on the light variant (default)", () => {
      const { container } = render(<SectionHeader title="Nieuws" ruled />);
      const hairline = container.querySelector('[aria-hidden="true"]');
      expect(hairline).toHaveClass("bg-ink");
    });
  });
});
