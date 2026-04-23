import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InterviewHero } from "./InterviewHero";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

const playerWithAll: IndexedSubject = {
  _key: "k1",
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

const playerJeroen: IndexedSubject = {
  _key: "k2",
  kind: "player",
  playerRef: {
    firstName: "Jeroen",
    lastName: "Van den Berghe",
    jerseyNumber: 5,
    position: "Verdediger",
    transparentImageUrl: null,
    psdImageUrl: "https://cdn.sanity.io/jeroen.webp",
  },
};

const playerThomas: IndexedSubject = {
  _key: "k3",
  kind: "player",
  playerRef: {
    firstName: "Thomas",
    lastName: "Peeters",
    jerseyNumber: 11,
    position: "Aanvaller",
    transparentImageUrl: null,
    psdImageUrl: "https://cdn.sanity.io/thomas.webp",
  },
};

const playerLuc: IndexedSubject = {
  _key: "k4",
  kind: "player",
  playerRef: {
    firstName: "Luc",
    lastName: "Janssens",
    jerseyNumber: 3,
    position: "Keeper",
    transparentImageUrl: null,
    psdImageUrl: "https://cdn.sanity.io/luc.webp",
  },
};

const staffSubject: IndexedSubject = {
  _key: "s1",
  kind: "staff",
  staffRef: {
    firstName: "John",
    lastName: "Coach",
    functionTitle: "Hoofdtrainer",
    photoUrl: null,
  },
};

describe("InterviewHero — N=1 (single subject)", () => {
  it("renders kicker `Interview | #9 · MIDDENVELDER` for a player with jersey + position", () => {
    render(
      <InterviewHero
        title="Een gesprek over vijf seizoenen"
        subjects={[playerWithAll]}
      />,
    );
    const kicker = screen.getByTestId("interview-hero-kicker");
    const text = (kicker.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(text).toMatch(/Interview\s*\|\s*#9\s*·\s*MIDDENVELDER/);
  });

  it("omits the position segment when only jersey is available", () => {
    const playerJerseyOnly: IndexedSubject = {
      _key: "k1",
      kind: "player",
      playerRef: {
        firstName: "Jan",
        lastName: "Janssens",
        jerseyNumber: 7,
        position: null,
        psdImageUrl: null,
      },
    };
    render(<InterviewHero title="Title" subjects={[playerJerseyOnly]} />);
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text).toContain("#7");
    expect(text).not.toContain("·");
  });

  it("renders bare `Interview` for a staff subject (kicker meta only on players)", () => {
    render(<InterviewHero title="Title" subjects={[staffSubject]} />);
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text.trim()).toMatch(/^Interview$/);
    // Subtitle still renders (the subject has a resolvable name).
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "John Coach",
    );
  });

  it("falls back to `Interview` only when subjects array is empty (defensive N=0)", () => {
    render(<InterviewHero title="Title" subjects={[]} />);
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text.trim()).toMatch(/^Interview$/);
    expect(screen.queryByTestId("interview-hero-subtitle")).toBeNull();
    expect(screen.queryByTestId("interview-hero-image")).toBeNull();
    expect(screen.queryByTestId("interview-hero-portrait-grid")).toBeNull();
  });

  it("tolerates null subjects and renders title only", () => {
    render(<InterviewHero title="Title" subjects={null} />);
    expect(screen.getByTestId("interview-hero-title")).toBeInTheDocument();
    expect(screen.queryByTestId("interview-hero-subtitle")).toBeNull();
  });

  it("tolerates undefined subjects and renders title only", () => {
    render(<InterviewHero title="Title" subjects={undefined} />);
    expect(screen.getByTestId("interview-hero-title")).toBeInTheDocument();
    expect(screen.queryByTestId("interview-hero-subtitle")).toBeNull();
  });

  it("renders the subject's full name as the subtitle", () => {
    render(<InterviewHero title="Title" subjects={[playerWithAll]} />);
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("renders the 4:5 portrait image when coverImageUrl is provided", () => {
    render(
      <InterviewHero
        title="Title"
        subjects={[playerWithAll]}
        coverImageUrl="https://cdn.sanity.io/cover.webp"
      />,
    );
    expect(screen.getByTestId("interview-hero-image")).toBeInTheDocument();
  });

  it("omits the image when coverImageUrl is missing — headline carries the hero alone", () => {
    render(<InterviewHero title="Title" subjects={[playerWithAll]} />);
    expect(screen.queryByTestId("interview-hero-image")).toBeNull();
    expect(screen.getByTestId("interview-hero-title")).toBeInTheDocument();
  });
});

describe("InterviewHero — N=2 (duo)", () => {
  it("renders bare `Interview` kicker (no meta slot)", () => {
    render(
      <InterviewHero title="Duo" subjects={[playerWithAll, playerJeroen]} />,
    );
    const text = screen.getByTestId("interview-hero-kicker").textContent ?? "";
    expect(text.trim()).toMatch(/^Interview$/);
  });

  it("joins subject names with ampersand in the subtitle", () => {
    render(
      <InterviewHero title="Duo" subjects={[playerWithAll, playerJeroen]} />,
    );
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans & Jeroen Van den Berghe",
    );
  });

  it("renders a portrait grid with two entries", () => {
    render(
      <InterviewHero title="Duo" subjects={[playerWithAll, playerJeroen]} />,
    );
    const grid = screen.getByTestId("interview-hero-portrait-grid");
    expect(grid).toBeInTheDocument();
    expect(grid.dataset.subjectCount).toBe("2");
    expect(screen.getAllByTestId("interview-hero-portrait")).toHaveLength(2);
  });

  it("does NOT render the single coverImageUrl slot on duo", () => {
    render(
      <InterviewHero
        title="Duo"
        subjects={[playerWithAll, playerJeroen]}
        coverImageUrl="https://cdn.sanity.io/cover.webp"
      />,
    );
    expect(screen.queryByTestId("interview-hero-image")).toBeNull();
  });
});

describe("InterviewHero — N=3 (trio) and N=4 (panel)", () => {
  it("N=3: bare kicker + Dutch-Oxford join with `en` + 3-portrait grid", () => {
    render(
      <InterviewHero
        title="Trio"
        subjects={[playerWithAll, playerJeroen, playerThomas]}
      />,
    );
    expect(
      screen.getByTestId("interview-hero-kicker").textContent?.trim(),
    ).toMatch(/^Interview$/);
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans, Jeroen Van den Berghe en Thomas Peeters",
    );
    const grid = screen.getByTestId("interview-hero-portrait-grid");
    expect(grid.dataset.subjectCount).toBe("3");
    expect(screen.getAllByTestId("interview-hero-portrait")).toHaveLength(3);
  });

  it("N=4: bare kicker + panel subtitle + 4-portrait grid", () => {
    render(
      <InterviewHero
        title="Panel"
        subjects={[playerWithAll, playerJeroen, playerThomas, playerLuc]}
      />,
    );
    expect(
      screen.getByTestId("interview-hero-kicker").textContent?.trim(),
    ).toMatch(/^Interview$/);
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans, Jeroen Van den Berghe, Thomas Peeters en Luc Janssens",
    );
    const grid = screen.getByTestId("interview-hero-portrait-grid");
    expect(grid.dataset.subjectCount).toBe("4");
    expect(screen.getAllByTestId("interview-hero-portrait")).toHaveLength(4);
  });
});
