import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketStub } from "./TicketStub";

describe("TicketStub", () => {
  it("renders label and value", () => {
    render(<TicketStub label="STAMNR." value="55" />);
    expect(screen.getByText("STAMNR.")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("position controls the data attribute", () => {
    const { container } = render(
      <TicketStub label="X" value="Y" position="overlay-tr" />,
    );
    expect(container.firstChild).toHaveAttribute("data-position", "overlay-tr");
  });

  it("rotation prop is applied as transform", () => {
    const { container } = render(
      <TicketStub label="X" value="Y" rotation={4} />,
    );
    expect((container.firstChild as HTMLElement).style.transform).toContain(
      "rotate(4deg)",
    );
  });
});
