import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventHero } from "./EventHero";

describe("EventHero", () => {
  it("renders `EVENT | <ageGroup>` when the feature has an age group", () => {
    render(
      <EventHero
        title="Lentetornooi U13 — zaterdag in Elewijt"
        feature={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
          ageGroup: "U13",
        }}
      />,
    );
    const kicker = screen.getByTestId("event-hero-kicker");
    expect(kicker.textContent).toMatch(/Event\s*\|\s*U13/i);
  });

  it("falls back to `competitionTag` when `ageGroup` is missing", () => {
    render(
      <EventHero
        title="Clubfeest"
        feature={{
          title: "Clubfeest",
          date: "2026-04-27",
          competitionTag: "Clubfeest",
        }}
      />,
    );
    const kicker = screen.getByTestId("event-hero-kicker");
    expect(kicker.textContent).toMatch(/Event\s*\|\s*Clubfeest/i);
  });

  it("collapses to bare `EVENT` kicker when neither ageGroup nor competitionTag is set", () => {
    render(
      <EventHero
        title="Datum volgt"
        feature={{
          title: "Datum volgt",
          date: "2026-04-27",
        }}
      />,
    );
    const kicker = screen.getByTestId("event-hero-kicker");
    const text = (kicker.textContent ?? "").trim();
    expect(text).toMatch(/^Event$/i);
  });

  it("renders a bare `EVENT` kicker when no feature eventFact is provided at all", () => {
    render(<EventHero title="Evenementenupdate" feature={null} />);
    const kicker = screen.getByTestId("event-hero-kicker");
    const text = (kicker.textContent ?? "").trim();
    expect(text).toMatch(/^Event$/i);
  });

  it("renders the article title as the h1", () => {
    render(
      <EventHero
        title="Lentetornooi U13 — zaterdag in Elewijt"
        feature={{
          title: "Lentetornooi U13",
          date: "2026-04-27",
          ageGroup: "U13",
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Lentetornooi U13 — zaterdag in Elewijt",
    );
  });

  it("never renders an empty h1 — falls back to `Event` when title is blank", () => {
    render(<EventHero title="   " feature={null} />);
    // Anchor the regex so the fallback must be exactly "Event" — a
    // future refactor that changes the fallback to "Events coming soon"
    // would otherwise slip through.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Event$/,
    );
  });
});
