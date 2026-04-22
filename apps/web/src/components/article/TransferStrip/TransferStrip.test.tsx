import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferStrip } from "./TransferStrip";

describe("TransferStrip", () => {
  it("incoming: renders van=other + naar=KCVV, label INKOMEND, green arrow", () => {
    render(
      <TransferStrip
        feature={{
          direction: "incoming",
          playerName: "Jan",
          otherClubName: "Standard Luik",
          otherClubContext: "Jupiler Pro League · U23",
          kcvvContext: "Derde Amateur · A-ploeg",
        }}
      />,
    );
    const strip = screen.getByTestId("transfer-strip");
    expect(strip).toHaveAttribute("data-direction", "incoming");
    expect(screen.getByTestId("transfer-strip-label")).toHaveTextContent(
      /Inkomend/i,
    );
    const arrow = screen.getByTestId("transfer-strip-arrow");
    expect(arrow).toHaveClass("text-kcvv-green-bright");
    expect(strip).toHaveTextContent("Standard Luik");
    expect(strip).toHaveTextContent(/KCVV Elewijt/i);
    expect(strip).toHaveTextContent("Jupiler Pro League");
    expect(strip).toHaveTextContent("Derde Amateur");
  });

  it("outgoing: arrow and label use kcvv-warning (amber) — departure signalled without alarm", () => {
    render(
      <TransferStrip
        feature={{
          direction: "outgoing",
          playerName: "Jan",
          otherClubName: "KV Mechelen",
        }}
      />,
    );
    const arrow = screen.getByTestId("transfer-strip-arrow");
    const label = screen.getByTestId("transfer-strip-label");
    expect(arrow).toHaveClass("text-kcvv-warning");
    expect(label).toHaveClass("text-kcvv-warning");
    expect(label).toHaveTextContent(/Uitgaand/i);
  });

  it("extension: no arrow rendered; centered KCVV block + VERLENGD label + TOT date", () => {
    render(
      <TransferStrip
        feature={{
          direction: "extension",
          playerName: "Jan",
          until: "2028",
          kcvvContext: "Derde Amateur · A-ploeg",
        }}
      />,
    );
    const strip = screen.getByTestId("transfer-strip");
    expect(strip).toHaveAttribute("data-direction", "extension");
    // No arrow on extensions — the absence of direction IS the signal.
    expect(screen.queryByTestId("transfer-strip-arrow")).toBeNull();
    expect(screen.getByTestId("transfer-strip-label")).toHaveTextContent(
      /Verlengd/i,
    );
    expect(screen.getByTestId("transfer-strip-until")).toHaveTextContent(
      "2028",
    );
    expect(strip).toHaveTextContent(/KCVV Elewijt/i);
  });

  it("extension omits the until line when `until` is unset", () => {
    render(
      <TransferStrip
        feature={{
          direction: "extension",
          playerName: "Jan",
        }}
      />,
    );
    expect(screen.queryByTestId("transfer-strip-until")).toBeNull();
  });

  it("renders without context subtitles when both are missing", () => {
    render(
      <TransferStrip
        feature={{
          direction: "incoming",
          playerName: "Jan",
          otherClubName: "Club",
        }}
      />,
    );
    const strip = screen.getByTestId("transfer-strip");
    // Still renders the club names — context subtitles are purely
    // additive when provided.
    expect(strip).toHaveTextContent("Club");
    expect(strip).toHaveTextContent(/KCVV Elewijt/i);
  });
});
