import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransferStrip } from "./TransferStrip";

describe("TransferStrip", () => {
  it("incoming: renders other club on the from side, KCVV on the to side, with a green arrow between", () => {
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
    const arrow = screen.getByTestId("transfer-strip-arrow");
    expect(arrow).toHaveClass("text-kcvv-green-bright");
    // Arrow carries the direction label in a data attribute — useful for
    // analytics/assistive inspection without rendering duplicate copy.
    expect(arrow).toHaveAttribute("data-label", "Inkomend");
    expect(strip).toHaveTextContent("Standard Luik");
    expect(strip).toHaveTextContent(/KCVV Elewijt/i);
    expect(strip).toHaveTextContent("Jupiler Pro League");
    expect(strip).toHaveTextContent("Derde Amateur");
    // The van/naar/inkomend labels are intentionally absent — the arrow
    // direction + colour carries the semantic.
    expect(strip).not.toHaveTextContent(/^van$/i);
    expect(strip).not.toHaveTextContent(/^naar$/i);
  });

  it("outgoing: arrow in kcvv-warning (amber) with KCVV on the from side and the other club on the to side", () => {
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
    expect(arrow).toHaveClass("text-kcvv-warning");
    expect(arrow).toHaveAttribute("data-label", "Uitgaand");

    // Verify the direction-resolver contract: outgoing = KCVV → other,
    // so KCVV renders on the from side and the other club on the to
    // side — in that order in the DOM.
    const strip = screen.getByTestId("transfer-strip");
    const stripText = strip.textContent ?? "";
    const kcvvIdx = stripText.indexOf("KCVV Elewijt");
    const otherIdx = stripText.indexOf("KV Mechelen");
    expect(kcvvIdx).toBeGreaterThan(-1);
    expect(otherIdx).toBeGreaterThan(-1);
    expect(kcvvIdx).toBeLessThan(otherIdx);
  });

  it("extension: no arrow, centered KCVV block + VERLENGD label + TOT date", () => {
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
    expect(screen.queryByTestId("transfer-strip-arrow")).toBeNull();
    // Extension keeps the `VERLENGD` label — there is no arrow to carry
    // the direction, so the label is the signal.
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
    expect(strip).toHaveTextContent("Club");
    expect(strip).toHaveTextContent(/KCVV Elewijt/i);
  });
});
