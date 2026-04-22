import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferFactOverview } from "./TransferFactOverview";

describe("TransferFactOverview", () => {
  it("incoming: kicker uses green-dark colour class", () => {
    render(
      <TransferFactOverview
        value={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    const kicker = screen.getByTestId("transfer-overview-kicker");
    expect(kicker).toHaveClass("text-kcvv-green-dark");
    expect(kicker).toHaveTextContent(/INCOMING/i);
  });

  it("outgoing: kicker uses gray colour class (reported, not celebrated — no red pill)", () => {
    render(
      <TransferFactOverview
        value={{
          direction: "outgoing",
          playerName: "Jan",
          otherClubName: "KV Mechelen",
        }}
      />,
    );
    const kicker = screen.getByTestId("transfer-overview-kicker");
    expect(kicker).toHaveClass("text-kcvv-gray");
    expect(kicker).not.toHaveClass("text-kcvv-green-dark");
    expect(kicker).toHaveTextContent(/OUTGOING/i);
  });

  it("renders the player name and the age/position meta row", () => {
    render(
      <TransferFactOverview
        value={{
          direction: "incoming",
          playerName: "Maxim Breugelmans",
          position: "Middenvelder",
          age: 27,
          otherClubName: "Standard Luik",
        }}
      />,
    );
    expect(screen.getByTestId("transfer-overview-name")).toHaveTextContent(
      "Maxim Breugelmans",
    );
    const meta = screen.getByTestId("transfer-overview-meta");
    expect(meta.textContent).toMatch(/27/);
    expect(meta.textContent).toMatch(/Middenvelder/i);
  });

  it("renders the from→to club row with both names", () => {
    render(
      <TransferFactOverview
        value={{
          direction: "incoming",
          playerName: "Maxim",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    const row = screen.getByTestId("transfer-overview-clubs");
    expect(row).toHaveTextContent("Standard Luik");
    expect(row).toHaveTextContent(/KCVV/i);
  });

  it("extension: single KCVV row + 'until' line, no from→to arrow row", () => {
    render(
      <TransferFactOverview
        value={{
          direction: "extension",
          playerName: "Jan",
          until: "2028",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-overview-clubs")).toBeNull();
    const solo = screen.getByTestId("transfer-overview-kcvv-only");
    expect(solo).toHaveTextContent(/KCVV/i);
    expect(screen.getByTestId("transfer-overview-until")).toHaveTextContent(
      "2028",
    );
  });
});
