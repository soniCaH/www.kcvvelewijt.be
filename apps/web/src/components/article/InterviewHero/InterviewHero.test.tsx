import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InterviewHero } from "./InterviewHero";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const playerWithAll: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    position: "Middenvelder",
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

describe("InterviewHero", () => {
  it("renders kicker `Interview | #9 · MIDDENVELDER` for a player with jersey + position", () => {
    render(
      <InterviewHero
        title="Een gesprek over vijf seizoenen"
        subject={playerWithAll}
      />,
    );
    const kicker = screen.getByTestId("interview-hero-kicker");
    const text = (kicker.textContent ?? "").replace(/\s+/g, " ").trim();
    // The `|` separates article-type from meta; `·` separates meta items.
    // CSS uppercases the label; the DOM content stays as authored.
    expect(text).toMatch(/Interview\s*\|\s*#9\s*·\s*MIDDENVELDER/);
  });

  it("omits the position segment when only jersey is available", () => {
    render(
      <InterviewHero
        title="Title"
        subject={{
          kind: "player",
          playerRef: {
            firstName: "Jan",
            lastName: "Janssens",
            jerseyNumber: 7,
            position: null,
            psdImageUrl: null,
          },
        }}
      />,
    );
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text).toContain("#7");
    expect(text).not.toContain("·");
  });

  it("falls back to `Interview` only when subject cannot be resolved", () => {
    render(<InterviewHero title="Title" subject={null} />);
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text.trim()).toMatch(/^Interview$/);
  });

  it("renders the subject's full name as the subtitle", () => {
    render(<InterviewHero title="Title" subject={playerWithAll} />);
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("omits the subtitle when subject is null", () => {
    render(<InterviewHero title="Title" subject={null} />);
    expect(screen.queryByTestId("interview-hero-subtitle")).toBeNull();
  });

  it("renders the 4:5 portrait image when coverImageUrl is provided", () => {
    render(
      <InterviewHero
        title="Title"
        subject={playerWithAll}
        coverImageUrl="https://cdn.sanity.io/cover.webp"
      />,
    );
    expect(screen.getByTestId("interview-hero-image")).toBeInTheDocument();
  });

  it("omits the image when coverImageUrl is missing — headline carries the hero alone", () => {
    render(<InterviewHero title="Title" subject={playerWithAll} />);
    expect(screen.queryByTestId("interview-hero-image")).toBeNull();
    expect(screen.getByTestId("interview-hero-title")).toBeInTheDocument();
  });
});
