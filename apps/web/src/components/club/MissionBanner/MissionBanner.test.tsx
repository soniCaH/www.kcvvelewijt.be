import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MissionBanner } from "./MissionBanner";

describe("MissionBanner", () => {
  it("renders quote text and attribution", () => {
    render(<MissionBanner />);

    expect(
      screen.getByText(
        /Wij zijn KCVV Elewijt.*passie voor voetbal het hele dorp verbindt/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("— Sportpark Elewijt, sinds 1948"),
    ).toBeInTheDocument();
  });

  it("renders decorative quote icon", () => {
    render(<MissionBanner />);

    expect(screen.getByText("\u201C")).toBeInTheDocument();
  });
});
