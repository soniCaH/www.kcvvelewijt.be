import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedCardOpponentTemplate } from "./RedCardOpponentTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  minute: "81",
};

describe("RedCardOpponentTemplate", () => {
  it("renders the rode kaart · tegenstander kicker", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("Rode kaart · tegenstander")).toBeInTheDocument();
  });

  it("renders the Rood shout headline", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    const heading = screen.getByRole("heading", { name: /rood/i });
    expect(heading.textContent).toBe("Rood!");
  });

  it("notes the opponent and minute on the meta line", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("Eppegem · 81'")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });
});
