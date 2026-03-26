import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHero } from "./PageHero";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("PageHero", () => {
  const defaultProps = {
    image: "/images/hero-club.jpg",
    label: "Onze club",
    headline: (
      <>
        De plezantste
        <br />
        <span className="text-kcvv-green">compagnie</span>
      </>
    ),
    body: "Al meer dan 75 jaar de thuishaven voor voetballiefhebbers.",
  };

  it("renders label, headline, and body text", () => {
    render(<PageHero {...defaultProps} />);

    expect(screen.getByText("Onze club")).toBeInTheDocument();
    expect(screen.getByText(/de plezantste/i)).toBeInTheDocument();
    expect(screen.getByText(/compagnie/i)).toBeInTheDocument();
    expect(screen.getByText(/Al meer dan 75 jaar/)).toBeInTheDocument();
  });

  it("does not render a built-in SVG diagonal", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders LinkButton with arrow when cta prop is provided", () => {
    render(
      <PageHero
        {...defaultProps}
        cta={{ label: "Bekijk de ploeg", href: "/ploegen/a" }}
      />,
    );

    const link = screen.getByRole("link", { name: /bekijk de ploeg/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/ploegen/a");
  });

  it("does not render a CTA when cta prop is omitted", () => {
    render(<PageHero {...defaultProps} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders background image with provided src and alt", () => {
    render(<PageHero {...defaultProps} imageAlt="Club photo" />);
    const img = screen.getByAltText("Club photo");
    expect(img).toHaveAttribute("src", "/images/hero-club.jpg");
  });

  it("uses green accent bar in label", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    const accentBar = container.querySelector(".bg-kcvv-green");
    expect(accentBar).toBeInTheDocument();
  });
});
