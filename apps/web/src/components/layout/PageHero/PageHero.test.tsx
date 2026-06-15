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
    kicker: "Kalender",
    headline: "Wedstrijdkalender",
    lead: "Alle wedstrijden en activiteiten van KCVV Elewijt.",
  };

  it("renders the kicker, headline, and lead", () => {
    render(<PageHero {...defaultProps} />);

    expect(screen.getByText("Kalender")).toBeInTheDocument();
    expect(screen.getByText(/wedstrijdkalender/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Alle wedstrijden en activiteiten/),
    ).toBeInTheDocument();
  });

  it("renders the headline as a level-1 heading", () => {
    render(<PageHero {...defaultProps} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/wedstrijdkalender/i);
  });

  it("renders a warm period terminator when no accent word is given", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    const period = container.querySelector("em.text-warm");
    expect(period).toBeInTheDocument();
    expect(period).toHaveTextContent(".");
  });

  it("does not warm-stylize an internal period in an un-curated CMS headline", () => {
    // Regression: the warm "." terminator is matched via indexOf("."), so a
    // headline that already contains a period must not get the warm emphasis
    // on its internal period (e.g. /club/[slug] CMS titles like "3de Prov. B").
    const { container } = render(
      <PageHero kicker="Club" headline="3de Prov. B kampioen" />,
    );
    expect(container.querySelector("em.text-warm")).not.toBeInTheDocument();
  });

  it("renders the accent word as a jersey-deep emphasis", () => {
    const { container } = render(
      <PageHero
        kicker="Onze club"
        headline="De plezantste compagnie"
        accent="compagnie"
      />,
    );
    const accent = container.querySelector("em.text-jersey-deep");
    expect(accent).toBeInTheDocument();
    expect(accent).toHaveTextContent("compagnie");
  });

  it("auto-hides the lead when it is absent", () => {
    render(<PageHero kicker="Club" headline="Scheurkalender" />);
    expect(screen.queryByText(/Alle wedstrijden/)).not.toBeInTheDocument();
  });

  it("renders the image inside a TapedFigure when an image is provided", () => {
    render(
      <PageHero
        {...defaultProps}
        image="/images/youth-trainers.jpg"
        imageAlt="KCVV jeugdtraining"
      />,
    );
    const img = screen.getByAltText("KCVV jeugdtraining");
    expect(img).toHaveAttribute("src", "/images/youth-trainers.jpg");
  });

  it("renders the typographic (no-image) state with a dotted divider", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
    const root = screen.getByTestId("page-hero");
    expect(root).toHaveAttribute("data-state", "typographic");
  });

  it("suppresses the image and uses display-md when size is compact", () => {
    const { container } = render(
      <PageHero
        {...defaultProps}
        image="/images/youth-trainers.jpg"
        imageAlt="KCVV jeugdtraining"
        size="compact"
      />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAttribute("data-size", "display-md");
    expect(screen.getByTestId("page-hero")).toHaveAttribute(
      "data-size",
      "compact",
    );
  });

  it("renders a CTA LinkButton with arrow when cta prop is provided", () => {
    render(
      <PageHero
        kicker="Club"
        headline="Het verhaal van de Klakkei"
        accent="de Klakkei"
        cta={{ label: "Lees meer", href: "/club/geschiedenis" }}
      />,
    );
    const link = screen.getByRole("link", { name: /lees meer/i });
    expect(link).toHaveAttribute("href", "/club/geschiedenis");
  });

  it("does not render a CTA when the cta prop is omitted", () => {
    render(<PageHero {...defaultProps} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders one warm shell tape strip in the typographic state", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    const warmTapes = container.querySelectorAll('[data-color="warm"]');
    expect(warmTapes).toHaveLength(1);
  });

  it("adds the figure's warm tape in the image state (shell + figure)", () => {
    const { container } = render(
      <PageHero {...defaultProps} image="/images/x.jpg" imageAlt="x" />,
    );
    const warmTapes = container.querySelectorAll('[data-color="warm"]');
    expect(warmTapes).toHaveLength(2);
  });

  it("does not render any legacy gradient, font-title, or kcvv-* classes", () => {
    const { container } = render(
      <PageHero {...defaultProps} image="/images/x.jpg" imageAlt="x" />,
    );
    expect(container.querySelector('[class*="kcvv-"]')).not.toBeInTheDocument();
    expect(
      container.querySelector('[class*="font-title"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-testid='hero-gradient']"),
    ).not.toBeInTheDocument();
  });
});
