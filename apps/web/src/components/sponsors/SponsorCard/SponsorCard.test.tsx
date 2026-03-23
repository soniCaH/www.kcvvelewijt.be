/**
 * SponsorCard Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorCard } from "./SponsorCard";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}));

const sponsor: Sponsor = {
  id: "1",
  name: "Test Sponsor",
  logo: "/logos/test.png",
  url: "https://example.com",
};

const sponsorNoUrl: Sponsor = {
  id: "2",
  name: "No URL Sponsor",
  logo: "/logos/nourl.png",
};

describe("SponsorCard", () => {
  describe("styling", () => {
    it("renders logo with grayscale filter", () => {
      render(<SponsorCard sponsor={sponsorNoUrl} />);

      const img = screen.getByRole("img");
      expect(img).toHaveClass("grayscale");
    });

    it("renders without background color", () => {
      const { container } = render(<SponsorCard sponsor={sponsorNoUrl} />);

      const card = container.querySelector("[class*='aspect-']");
      expect(card).not.toHaveClass("bg-white/15");
      expect(card).not.toHaveClass("bg-gray-100");
    });
  });

  describe("rendering", () => {
    it("renders sponsor logo with correct alt text", () => {
      render(<SponsorCard sponsor={sponsor} />);

      const img = screen.getByAltText("Test Sponsor");
      expect(img).toBeInTheDocument();
    });

    it("wraps in link when sponsor has URL", () => {
      render(<SponsorCard sponsor={sponsor} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("does not wrap in link when sponsor has no URL", () => {
      render(<SponsorCard sponsor={sponsorNoUrl} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
