import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialHero, type EditorialHeroProps } from "./EditorialHero";

const BASE: Omit<EditorialHeroProps, "variant"> = {
  title: "De zomer van 2026 begint nu.",
  lead: "Een rustige editorial lead die de toon zet.",
  kicker: [{ label: "ANNOUNCEMENT" }, { label: "06 MEI 2026" }],
  author: "Tom Janssens",
};

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
      const view = render(<EditorialHero variant={variant} {...BASE} />);
      const h1 = view.container.querySelector("h1")?.textContent;
      view.unmount();
      return h1;
    });
    expect(new Set(heads).size).toBe(1);
  });

  it("treats placement='homepage' the same as 'detail' in this issue (variants land in #1638)", () => {
    const detailView = render(
      <EditorialHero variant="announcement" {...BASE} placement="detail" />,
    );
    const detailHtml = detailView.container.innerHTML;
    detailView.unmount();
    const homepageView = render(
      <EditorialHero variant="announcement" {...BASE} placement="homepage" />,
    );
    expect(homepageView.container.innerHTML).toBe(detailHtml);
  });
});
