import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { GalleryCard, formatImageCount } from "./GalleryCard";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const defaultProps = {
  title: "Zemst derby",
  href: "/galerij/zemst-derby",
  imageCount: 24,
};

describe("formatImageCount", () => {
  it("uses the singular for one photo", () => {
    expect(formatImageCount(1)).toBe("1 foto");
  });

  it("uses the Dutch plural for zero or many photos", () => {
    expect(formatImageCount(0)).toBe("0 foto's");
    expect(formatImageCount(24)).toBe("24 foto's");
  });
});

describe("GalleryCard", () => {
  it("renders the photo count label", () => {
    render(<GalleryCard {...defaultProps} />);
    expect(screen.getByText("24 foto's")).toBeInTheDocument();
  });

  it("links to the gallery detail page with an accessible label", () => {
    render(<GalleryCard {...defaultProps} />);
    const link = screen.getByRole("link", { name: "Zemst derby" });
    expect(link).toHaveAttribute("href", "/galerij/zemst-derby");
  });

  it("renders the cover image when provided", () => {
    render(
      <GalleryCard {...defaultProps} coverUrl="/cover.webp" coverAlt="Cover" />,
    );
    expect(screen.getByAltText("Cover")).toBeInTheDocument();
    expect(
      screen.queryByTestId("newscard-image-fallback"),
    ).not.toBeInTheDocument();
  });

  it("renders the striped fallback when no cover is provided", () => {
    render(<GalleryCard {...defaultProps} />);
    expect(screen.getByTestId("newscard-image-fallback")).toBeInTheDocument();
  });

  it('renders the "Bekijk de foto\'s" call-to-action', () => {
    render(<GalleryCard {...defaultProps} />);
    expect(screen.getByText("Bekijk de foto's →")).toBeInTheDocument();
  });
});
