import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferFactOverview } from "./TransferFactOverview";

describe("TransferFactOverview", () => {
  it("incoming: kicker uses green-bright colour class on the dark section and reads 'Inkomend'", () => {
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
    expect(kicker).toHaveClass("text-kcvv-green-bright");
    expect(kicker).toHaveTextContent(/Inkomend/i);
  });

  it("outgoing: kicker uses kcvv-warning (amber) — reported, not alarmed", () => {
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
    expect(kicker).toHaveClass("text-kcvv-warning");
    expect(kicker).not.toHaveClass("text-kcvv-green-bright");
    expect(kicker).toHaveTextContent(/Uitgaand/i);
  });

  it("renders on a full-bleed dark band — consecutive rows stack into one continuous section", () => {
    const { container } = render(
      <TransferFactOverview
        value={{
          direction: "incoming",
          playerName: "Jan",
          otherClubName: "Standard Luik",
        }}
      />,
    );
    const section = container.querySelector(
      "[data-testid='transfer-overview']",
    );
    expect(section).toHaveClass("bg-kcvv-gray-dark");
    expect(section).toHaveClass("full-bleed");
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

  it("renders the from→to club row with both names and a 'transfer' status label", () => {
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
    expect(screen.getByTestId("transfer-overview-status")).toHaveTextContent(
      /transfer/i,
    );
  });

  it("extension: single KCVV row + TOT status label, no from→to arrow row", () => {
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
    expect(screen.getByTestId("transfer-overview-status")).toHaveTextContent(
      /tot 2028/i,
    );
  });
});
