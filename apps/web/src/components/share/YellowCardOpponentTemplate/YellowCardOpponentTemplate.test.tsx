import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YellowCardOpponentTemplate } from "./YellowCardOpponentTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  minute: "60",
};

describe("YellowCardOpponentTemplate", () => {
  it("renders the gele kaart · tegenstander kicker", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("Gele kaart · tegenstander")).toBeInTheDocument();
  });

  it("names the opponent", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("Eppegem")).toBeInTheDocument();
  });

  it("renders the minute", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("60'")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(
      <YellowCardOpponentTemplate {...defaultProps} />,
    );
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });
});
