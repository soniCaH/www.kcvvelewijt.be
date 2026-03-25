// apps/web/src/components/design-system/SectionHeader/SectionHeader.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  describe("Title", () => {
    it("renders title text", () => {
      render(<SectionHeader title="Laatste nieuws" />);
      expect(screen.getByText("Laatste nieuws")).toBeInTheDocument();
    });

    it("renders as h2 by default", () => {
      render(<SectionHeader title="Nieuws" />);
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    });

    it("renders as the requested heading level", () => {
      render(<SectionHeader title="Nieuws" as="h3" />);
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });

    it("has green left border class", () => {
      const { container } = render(<SectionHeader title="Nieuws" />);
      expect(container.querySelector("h2")).toHaveClass(
        "border-kcvv-green-bright",
      );
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

    it("does not render link when linkText is omitted", () => {
      render(<SectionHeader title="Nieuws" linkHref="/nieuws" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render link when linkHref is omitted", () => {
      render(<SectionHeader title="Nieuws" linkText="Alle berichten" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Variant", () => {
    it("light variant applies kcvv-black title color", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" variant="light" />,
      );
      expect(container.querySelector("h2")).toHaveClass("text-kcvv-black!");
    });

    it("dark variant applies white title color", () => {
      const { container } = render(
        <SectionHeader title="Nieuws" variant="dark" />,
      );
      expect(container.querySelector("h2")).toHaveClass("text-white!");
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
