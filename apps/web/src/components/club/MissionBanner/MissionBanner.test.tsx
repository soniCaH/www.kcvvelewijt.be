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

  it("renders custom quote and attribution when props are given", () => {
    render(
      <MissionBanner
        quote="Bij KCVV Elewijt staat plezier op één."
        attribution="— Jeugdopleiding KCVV Elewijt"
      />,
    );

    expect(
      screen.getByText("Bij KCVV Elewijt staat plezier op één."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("— Jeugdopleiding KCVV Elewijt"),
    ).toBeInTheDocument();
    // Default club content should not be present
    expect(screen.queryByText(/Wij zijn KCVV Elewijt/)).not.toBeInTheDocument();
  });
});
