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

vi.mock("next/navigation", () => ({
  usePathname: () => "/club/bestuur",
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
    const { container } = render(
      <PageHero {...defaultProps} image="/images/youth-trainers.jpg" />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/youth-trainers.jpg");
  });

  it("keeps the hero image decorative — the h1 already names the page", () => {
    // #2559 rule 1. The empty alt is a decision, not a parameter default:
    // there is no prop a caller could pass to override it.
    const { container } = render(
      <PageHero {...defaultProps} image="/images/youth-trainers.jpg" />,
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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

  it("renders an adornment beside the heading when provided", () => {
    render(
      <PageHero
        {...defaultProps}
        adornment={<span data-testid="hero-adornment">crest</span>}
      />,
    );
    expect(screen.getByTestId("hero-adornment")).toBeInTheDocument();
    // The heading still renders alongside it.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("does not render an adornment slot when the prop is omitted", () => {
    render(<PageHero {...defaultProps} />);
    expect(screen.queryByTestId("hero-adornment")).not.toBeInTheDocument();
  });

  it("renders one warm shell tape strip in the typographic state", () => {
    const { container } = render(<PageHero {...defaultProps} />);
    const warmTapes = container.querySelectorAll('[data-color="warm"]');
    expect(warmTapes).toHaveLength(1);
  });

  it("adds the figure's warm tape in the image state (shell + figure)", () => {
    const { container } = render(
      <PageHero {...defaultProps} image="/images/x.jpg" />,
    );
    const warmTapes = container.querySelectorAll('[data-color="warm"]');
    expect(warmTapes).toHaveLength(2);
  });

  describe("register / tone", () => {
    it("defaults to band · cream so no existing call site changes", () => {
      render(<PageHero {...defaultProps} />);
      const root = screen.getByTestId("page-hero");
      expect(root).toHaveAttribute("data-register", "band");
      expect(root).toHaveAttribute("data-tone", "cream");
    });

    it("band · dark paints the dark field and keeps the photo decorative", () => {
      const { container } = render(
        <PageHero
          {...defaultProps}
          tone="dark"
          image="/images/youth-trainers.jpg"
        />,
      );
      const root = screen.getByTestId("page-hero");
      expect(root).toHaveAttribute("data-tone", "dark");
      expect(root).toHaveClass("bg-jersey-deep-dark");
      expect(container.querySelector("img")).toHaveAttribute("alt", "");
      expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
        "data-size",
        "display-2xl",
      );
    });

    it("band · dark drops the photo column when the page has no portrait", () => {
      const { container } = render(<PageHero {...defaultProps} tone="dark" />);
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(screen.getByTestId("page-hero")).toHaveAttribute(
        "data-state",
        "typographic",
      );
    });

    it("minimal renders the words only — no band, no photo, no divider", () => {
      const { container } = render(
        <PageHero
          {...defaultProps}
          register="minimal"
          image="/images/youth-trainers.jpg"
        />,
      );
      const root = screen.getByTestId("page-hero");
      expect(root).toHaveAttribute("data-register", "minimal");
      expect(root.tagName).toBe("HEADER");
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(
        container.querySelector('[role="separator"]'),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /wedstrijdkalender/i,
      );
    });

    it("minimal owns the gap to the content below it", () => {
      // The nine routes that hand-rolled this opening each picked their own
      // (mb-10 / mb-8 / pb-8 / mt-10). One value, held here, is the point.
      render(<PageHero {...defaultProps} register="minimal" />);
      expect(screen.getByTestId("page-hero")).toHaveClass("mb-10");
    });

    it("minimal on a dark field flips the heading and lead to cream", () => {
      render(<PageHero {...defaultProps} register="minimal" tone="dark" />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
        "text-cream",
      );
      expect(screen.getByText(/Alle wedstrijden en activiteiten/)).toHaveClass(
        "text-cream",
      );
    });

    it("takes the accent warm on dark — jersey-deep would disappear there", () => {
      const { container } = render(
        <PageHero
          kicker="De club"
          headline="Beter worden begint met plezier"
          accent="plezier"
          tone="dark"
        />,
      );
      const accent = container.querySelector("em.text-warm");
      expect(accent).toHaveTextContent("plezier");
      expect(container.querySelector("em.text-jersey-deep")).toBeNull();
    });

    it("adds no terminator to a headline that ends in ? or !", () => {
      // EditorialHeading only appends the "." when the headline is not already
      // terminated, so asking for one warns on every render and emphasises
      // nothing. A CMS gallery title is the live path.
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container } = render(
        <PageHero
          register="minimal"
          kicker="KCVV Elewijt · Beelden"
          headline="Wie speelt er mee?"
        />,
      );
      expect(container.querySelector("em")).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("minimal renders trailing opening content in place", () => {
      render(
        <PageHero {...defaultProps} register="minimal">
          <p>Laatst bijgewerkt · juni 2026</p>
        </PageHero>,
      );
      expect(screen.getByText(/Laatst bijgewerkt/)).toBeInTheDocument();
    });
  });

  describe("up-link (#2428/#2442)", () => {
    it("band · cream omits the kicker row entirely when kicker is not passed", () => {
      // #2442 rule 6 — dropped where a page-owned up-link above this
      // opening would otherwise show the parent's name twice.
      const { container } = render(
        <PageHero headline="3de Prov. B kampioen" />,
      );
      expect(
        container.querySelector('[data-testid="page-hero-kicker"]'),
      ).not.toBeInTheDocument();
    });

    it("minimal omits the kicker row entirely when kicker is not passed", () => {
      const { container } = render(
        <PageHero register="minimal" headline="Wedstrijden" />,
      );
      expect(
        container.querySelector('[data-testid="page-hero-kicker"]'),
      ).not.toBeInTheDocument();
    });

    it("band · dark renders no up-link when none is passed", () => {
      render(<PageHero kicker="De club" headline="Het bestuur" tone="dark" />);
      expect(screen.queryByTestId("up-link")).not.toBeInTheDocument();
    });

    it("band · dark renders the up-link inside the band, tone-swapped to cream", () => {
      render(
        <PageHero
          kicker="De club"
          headline="Het bestuur"
          tone="dark"
          upLink={{ href: "/club", label: "De club" }}
        />,
      );
      const upLink = screen.getByTestId("up-link");
      expect(upLink).toHaveAttribute("data-tone", "cream");
      expect(upLink).toHaveAttribute("href", "/club");
      expect(upLink).toHaveTextContent("De club");
      // Inside the same full-bleed dark header, not a separate cream strip
      // above it.
      expect(screen.getByTestId("page-hero").contains(upLink)).toBe(true);
    });

    it("band · cream renders no up-link when none is passed", () => {
      render(<PageHero headline="Downloads" />);
      expect(screen.queryByTestId("up-link")).not.toBeInTheDocument();
    });

    it("band · cream places the up-link itself, above the card, tone ink", () => {
      // #2570 review round 2 — PageHero owns placement on every register; a
      // page never hand-renders its own <UpLink> above this component.
      render(
        <PageHero
          headline="Downloads"
          upLink={{ href: "/club", label: "De club" }}
        />,
      );
      const upLink = screen.getByTestId("up-link");
      const card = screen.getByTestId("page-hero");
      expect(upLink).toHaveAttribute("data-tone", "ink");
      expect(upLink).toHaveAttribute("href", "/club");
      // Above the card — a sibling, not a descendant.
      expect(card.contains(upLink)).toBe(false);
    });

    it("minimal renders no up-link when none is passed", () => {
      render(<PageHero register="minimal" headline="Wedstrijden" />);
      expect(screen.queryByTestId("up-link")).not.toBeInTheDocument();
    });

    it("minimal places the up-link itself, above the header, tone ink on cream", () => {
      render(
        <PageHero
          register="minimal"
          headline="Wedstrijden"
          upLink={{ href: "/ploegen/a-ploeg", label: "A-ploeg" }}
        />,
      );
      const upLink = screen.getByTestId("up-link");
      const header = screen.getByTestId("page-hero");
      expect(upLink).toHaveAttribute("data-tone", "ink");
      expect(header.contains(upLink)).toBe(false);
    });

    it("minimal on a dark field places the up-link itself, tone cream", () => {
      render(
        <PageHero
          register="minimal"
          tone="dark"
          headline="Wedstrijden"
          upLink={{ href: "/ploegen/a-ploeg", label: "A-ploeg" }}
        />,
      );
      expect(screen.getByTestId("up-link")).toHaveAttribute(
        "data-tone",
        "cream",
      );
    });

    it("band · cream drops the kicker→headline mt-2 gap when there is no kicker", () => {
      render(<PageHero headline="Downloads" />);
      expect(screen.getByRole("heading", { level: 1 })).not.toHaveClass("mt-2");
    });

    it("minimal drops the kicker→headline mt-2 gap when there is no kicker", () => {
      render(<PageHero register="minimal" headline="Wedstrijden" />);
      expect(screen.getByRole("heading", { level: 1 })).not.toHaveClass("mt-2");
    });

    it("keeps the mt-2 gap when a kicker is present", () => {
      render(<PageHero {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveClass("mt-2");
    });
  });

  it("does not render any legacy gradient, font-title, or kcvv-* classes", () => {
    const { container } = render(
      <PageHero {...defaultProps} image="/images/x.jpg" />,
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
