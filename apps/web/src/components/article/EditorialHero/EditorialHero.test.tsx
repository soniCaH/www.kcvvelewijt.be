import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialHero, type EditorialHeroProps } from "./EditorialHero";

// Shared shell args. `placement` and `slug` are absent here because they're
// part of the discriminated union — each test provides them as needed.
const BASE = {
  title: "De zomer van 2026 begint nu.",
  lead: "Een rustige editorial lead die de toon zet.",
  kicker: [{ label: "ANNOUNCEMENT" }, { label: "06 MEI 2026" }],
  author: "Tom Janssens",
} satisfies Partial<EditorialHeroProps>;

describe("EditorialHero", () => {
  it("renders the headline title as an <h1>", () => {
    render(<EditorialHero variant="announcement" {...BASE} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("De zomer van 2026 begint nu.");
  });

  it("renders kicker items inside the EditorialKicker sandwich", () => {
    render(<EditorialHero variant="announcement" {...BASE} />);
    expect(screen.getByText("ANNOUNCEMENT")).toBeInTheDocument();
    expect(screen.getByText("06 MEI 2026")).toBeInTheDocument();
  });

  it("renders the lead paragraph when supplied", () => {
    render(<EditorialHero variant="announcement" {...BASE} />);
    expect(
      screen.getByText("Een rustige editorial lead die de toon zet."),
    ).toBeInTheDocument();
  });

  it("drops the lead block when the prop is empty after trim", () => {
    render(<EditorialHero variant="announcement" {...BASE} lead="   " />);
    // EditorialLead renders a <p class="italic">; absence is the contract.
    expect(document.querySelector("p.italic")).toBeNull();
  });

  it("falls back to 'Door redactie' when no author is supplied", () => {
    const { author: _author, ...withoutAuthor } = BASE;
    render(<EditorialHero variant="announcement" {...withoutAuthor} />);
    expect(screen.getByText("Door redactie")).toBeInTheDocument();
  });

  it("renders the supplied author with a 'Door' prefix", () => {
    render(<EditorialHero variant="announcement" {...BASE} />);
    expect(screen.getByText("Door Tom Janssens")).toBeInTheDocument();
  });

  it("omits the cover column when coverImage is missing", () => {
    const { container } = render(
      <EditorialHero variant="announcement" {...BASE} />,
    );
    expect(container.querySelector("img")).toBeNull();
    // Shell renders one editorial column when cover is absent.
    expect(container.querySelectorAll("section > div")).toHaveLength(1);
  });

  it("renders the cover image artefact when supplied", () => {
    render(
      <EditorialHero
        variant="announcement"
        {...BASE}
        coverImage={{
          url: "https://example.com/cover.jpg",
          alt: "Spelers vieren een doelpunt",
        }}
      />,
    );
    expect(
      screen.getByAltText("Spelers vieren een doelpunt"),
    ).toBeInTheDocument();
  });

  it("accepts every variant in the discriminated union without changing the shell output", () => {
    const variants: EditorialHeroProps["variant"][] = [
      "announcement",
      "transfer",
      "event",
      "interview",
    ];
    const heads = variants.map((variant) => {
      // Cast through the announcement variant — every variant in the
      // discriminated union shares the same detail-placement shell shape,
      // so the iteration's behaviour is identical to a single render.
      const view = render(
        <EditorialHero {...({ ...BASE, variant } as EditorialHeroProps)} />,
      );
      const h1 = view.container.querySelector("h1")?.textContent;
      view.unmount();
      return h1;
    });
    expect(new Set(heads).size).toBe(1);
  });

  it("wraps the hero in an <a href='/nieuws/{slug}'> for placement='homepage'", () => {
    const { container } = render(
      <EditorialHero
        variant="announcement"
        {...BASE}
        placement="homepage"
        slug="zomer-2026"
      />,
    );
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/nieuws/zomer-2026");
    // aria-label uses the serialized title (string passes through).
    expect(link?.getAttribute("aria-label")).toBe(
      "De zomer van 2026 begint nu.",
    );
  });
});
