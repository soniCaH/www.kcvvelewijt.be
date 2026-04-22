import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferFactFeature } from "./TransferFactFeature";

describe("TransferFactFeature", () => {
  const incomingProps = {
    value: {
      direction: "incoming" as const,
      playerName: "Maxim Breugelmans",
      playerPhotoUrl: "https://cdn/maxim.png",
      position: "Middenvelder",
      age: 27,
      otherClubName: "Standard Luik",
      otherClubLogoUrl: "https://cdn/std.png",
    },
  };

  it("renders the kicker label in uppercase ('INCOMING', 'OUTGOING', 'EXTENSION')", () => {
    render(<TransferFactFeature {...incomingProps} />);
    expect(screen.getByTestId("transfer-feature-kicker")).toHaveTextContent(
      /INCOMING/i,
    );
  });

  it("renders the player name as a display heading", () => {
    render(<TransferFactFeature {...incomingProps} />);
    expect(screen.getByTestId("transfer-feature-name")).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("renders age and position with a middle-dot separator", () => {
    render(<TransferFactFeature {...incomingProps} />);
    const meta = screen.getByTestId("transfer-feature-meta");
    const text = (meta.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(text).toMatch(/27 jaar\s*·\s*Middenvelder/i);
  });

  it("incoming: renders from=other → to=KCVV and tags the KCVV row with the accent marker", () => {
    render(<TransferFactFeature {...incomingProps} />);
    const from = screen.getByTestId("transfer-feature-from");
    const to = screen.getByTestId("transfer-feature-to");
    expect(from).toHaveTextContent("Standard Luik");
    expect(to).toHaveTextContent(/KCVV/i);
    expect(to).toHaveAttribute("data-kcvv", "true");
    expect(from).toHaveAttribute("data-kcvv", "false");
  });

  it("outgoing: renders from=KCVV → to=other and tags the KCVV row with the accent marker", () => {
    render(
      <TransferFactFeature
        value={{
          direction: "outgoing",
          playerName: "Jan Janssens",
          otherClubName: "KV Mechelen",
        }}
      />,
    );
    const from = screen.getByTestId("transfer-feature-from");
    const to = screen.getByTestId("transfer-feature-to");
    expect(from).toHaveTextContent(/KCVV/i);
    expect(from).toHaveAttribute("data-kcvv", "true");
    expect(to).toHaveTextContent("KV Mechelen");
    expect(to).toHaveAttribute("data-kcvv", "false");
  });

  it("extension: renders a single KCVV row, an 'until' line, and no from/to rows", () => {
    render(
      <TransferFactFeature
        value={{
          direction: "extension",
          playerName: "Jan Janssens",
          until: "2028",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-feature-from")).toBeNull();
    expect(screen.queryByTestId("transfer-feature-to")).toBeNull();
    const kcvv = screen.getByTestId("transfer-feature-kcvv-only");
    expect(kcvv).toHaveTextContent(/KCVV/i);
    expect(kcvv).toHaveAttribute("data-kcvv", "true");
    expect(screen.getByTestId("transfer-feature-until")).toHaveTextContent(
      "2028",
    );
  });

  it("renders the note when provided", () => {
    render(
      <TransferFactFeature
        value={{
          ...incomingProps.value,
          note: "Blij om thuis te zijn.",
        }}
      />,
    );
    expect(screen.getByTestId("transfer-feature-note")).toHaveTextContent(
      "Blij om thuis te zijn.",
    );
  });

  it("omits the note element when no note is provided", () => {
    render(<TransferFactFeature {...incomingProps} />);
    expect(screen.queryByTestId("transfer-feature-note")).toBeNull();
  });

  it("renders the player photo when provided", () => {
    render(<TransferFactFeature {...incomingProps} />);
    expect(screen.getByTestId("transfer-feature-photo")).toBeInTheDocument();
  });

  it("omits the photo column when playerPhotoUrl is missing", () => {
    render(
      <TransferFactFeature
        value={{
          ...incomingProps.value,
          playerPhotoUrl: null,
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-feature-photo")).toBeNull();
  });
});
