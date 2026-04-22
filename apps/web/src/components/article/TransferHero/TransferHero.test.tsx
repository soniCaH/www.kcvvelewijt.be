import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferHero } from "./TransferHero";

describe("TransferHero", () => {
  it("renders the kicker as `TRANSFER | INKOMEND` for an incoming transfer", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    const kicker = screen.getByTestId("transfer-hero-kicker");
    const text = (kicker.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(text).toMatch(/Transfer\s*\|\s*Inkomend/i);
  });

  it("renders the player name as the h1", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("renders age + position as a meta row inside the hero", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Jan",
          age: 27,
          position: "Middenvelder",
          otherClubName: "KV",
        }}
      />,
    );
    const meta = screen.getByTestId("transfer-hero-meta");
    expect(meta.textContent).toMatch(/27 jaar/);
    expect(meta.textContent).toMatch(/Middenvelder/i);
  });

  it("renders a pull-quote when `note` is present, attributed to the player by default", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
          note: "Blij om thuis te zijn.",
        }}
      />,
    );
    const note = screen.getByTestId("transfer-hero-note");
    expect(note).toHaveTextContent("Blij om thuis te zijn.");
    expect(
      screen.getByTestId("transfer-hero-note-attribution"),
    ).toHaveTextContent("Maxim Breugelmans");
  });

  it("uses `noteAttribution` as the byline override when provided", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
          note: "Sterke aanwinst.",
          noteAttribution: "Sportieve cel",
        }}
      />,
    );
    expect(
      screen.getByTestId("transfer-hero-note-attribution"),
    ).toHaveTextContent("Sportieve cel");
  });

  it("omits the pull-quote entirely when `note` is empty", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-hero-note")).toBeNull();
  });

  it("renders the 4:5 cover portrait when coverImageUrl is provided", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim",
          otherClubName: "Standard Luik",
        }}
        coverImageUrl="https://cdn.sanity.io/cover.webp"
      />,
    );
    expect(screen.getByTestId("transfer-hero-image")).toBeInTheDocument();
  });

  it("omits the image when coverImageUrl is missing", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-hero-image")).toBeNull();
  });

  it("falls back to the article title when no feature transferFact is provided", () => {
    render(<TransferHero feature={null} fallbackTitle="Nieuwe transfer" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nieuwe transfer",
    );
    expect(screen.queryByTestId("transfer-hero-meta")).toBeNull();
    expect(screen.queryByTestId("transfer-hero-note")).toBeNull();
  });

  it("h1 never renders as an empty string even when all three signals are missing", () => {
    render(
      <TransferHero
        feature={{ direction: "incoming", playerName: "   " }}
        fallbackTitle="   "
      />,
    );
    // Defaults to the literal 'Transfer' so the page always has a heading.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Transfer/,
    );
  });
});
