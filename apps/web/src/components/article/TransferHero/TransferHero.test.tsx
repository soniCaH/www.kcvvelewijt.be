import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferHero } from "./TransferHero";

describe("TransferHero", () => {
  it("renders the kicker as `TRANSFER | INCOMING` for an incoming transfer", () => {
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
    expect(text).toMatch(/Transfer\s*\|\s*Incoming/i);
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

  it("renders age + position as a subline when both are present", () => {
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
    const sub = screen.getByTestId("transfer-hero-subtitle");
    expect(sub.textContent).toMatch(/27 jaar/);
    expect(sub.textContent).toMatch(/Middenvelder/i);
  });

  it("incoming: renders from=other · to=KCVV in the hero composition", () => {
    render(
      <TransferHero
        feature={{
          direction: "incoming",
          playerName: "Maxim",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    const from = screen.getByTestId("transfer-hero-from");
    const to = screen.getByTestId("transfer-hero-to");
    expect(from).toHaveTextContent("Standard Luik");
    expect(to).toHaveTextContent(/KCVV/i);
  });

  it("outgoing: swaps sides — from=KCVV · to=other", () => {
    render(
      <TransferHero
        feature={{
          direction: "outgoing",
          playerName: "Jan",
          otherClubName: "KV Mechelen",
        }}
      />,
    );
    expect(screen.getByTestId("transfer-hero-from")).toHaveTextContent(/KCVV/i);
    expect(screen.getByTestId("transfer-hero-to")).toHaveTextContent(
      "KV Mechelen",
    );
  });

  it("extension: collapses to a single KCVV row + 'until' label, no from→to", () => {
    render(
      <TransferHero
        feature={{
          direction: "extension",
          playerName: "Jan",
          until: "2028",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-hero-from")).toBeNull();
    expect(screen.queryByTestId("transfer-hero-to")).toBeNull();
    expect(screen.getByTestId("transfer-hero-kcvv-only")).toHaveTextContent(
      /KCVV/i,
    );
    expect(screen.getByTestId("transfer-hero-until")).toHaveTextContent("2028");
  });

  it("falls back to headline-only composition when no feature transferFact is provided", () => {
    render(<TransferHero feature={null} fallbackTitle="Nieuwe transfer" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nieuwe transfer",
    );
    expect(screen.queryByTestId("transfer-hero-from")).toBeNull();
    expect(screen.queryByTestId("transfer-hero-kcvv-only")).toBeNull();
  });
});
