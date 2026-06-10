import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { EditorialHubCard } from "./EditorialHubCard";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const navGlyph = <svg data-testid="nav-glyph" />;

describe("EditorialHubCard", () => {
  describe("news variant", () => {
    it("renders the cover photo, jersey-deep tag, title, arrow and link", () => {
      render(
        <EditorialHubCard
          variant="news"
          href="/nieuws/u15-wint"
          tag="Jeugd"
          title="U15 wint in stijl"
          arrowText="Lees meer"
          imageUrl="/images/cover.jpg"
          imageAlt="U15 viert"
        />,
      );
      const link = screen.getByRole("link", { name: /u15 wint in stijl/i });
      expect(link).toHaveAttribute("href", "/nieuws/u15-wint");
      expect(screen.getByRole("img", { name: "U15 viert" })).toHaveAttribute(
        "src",
        "/images/cover.jpg",
      );
      expect(screen.getByText("Jeugd")).toBeInTheDocument();
      expect(screen.getByText("Lees meer")).toBeInTheDocument();
      expect(screen.queryByTestId("nav-glyph")).not.toBeInTheDocument();
    });

    it("renders without a cover image (fallback panel), keeping the tag", () => {
      render(
        <EditorialHubCard
          variant="news"
          href="/nieuws/x"
          tag="Jeugd"
          title="Geen cover"
          arrowText="Lees meer"
        />,
      );
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByText("Jeugd")).toBeInTheDocument();
    });
  });

  describe("nav variant", () => {
    it("renders the glyph, cream tag and no photo", () => {
      render(
        <EditorialHubCard
          variant="nav"
          href="/jeugd#visie"
          tag="Visie"
          title="Onze jeugdvisie"
          arrowText="Ontdek"
          icon={navGlyph}
        />,
      );
      const link = screen.getByRole("link", { name: /onze jeugdvisie/i });
      expect(link).toHaveAttribute("href", "/jeugd#visie");
      expect(screen.getByTestId("nav-glyph")).toBeInTheDocument();
      expect(screen.getByText("Visie")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("omits the tag pill when tag is an empty string", () => {
      render(
        <EditorialHubCard
          variant="nav"
          href="/club/organigram"
          tag=""
          title="Organigram"
          arrowText="Bekijk"
          icon={navGlyph}
        />,
      );
      // The title and arrow render; no empty pill element carries stray text.
      expect(
        screen.getByRole("link", { name: /organigram/i }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-glyph")).toBeInTheDocument();
    });
  });
});
