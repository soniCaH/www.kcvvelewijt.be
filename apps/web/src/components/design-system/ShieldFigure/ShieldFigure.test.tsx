import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShieldFigure } from "./ShieldFigure";

describe("ShieldFigure", () => {
  it("renders an aria-labeled role=img", () => {
    render(<ShieldFigure variant="kcvv" name="KCVV" />);
    expect(screen.getByRole("img", { name: "KCVV" })).toBeInTheDocument();
  });

  it("falls back to last-word initial when no logo is provided", () => {
    render(<ShieldFigure variant="opponent" name="RC Mechelen" />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("uses the first character when the name has no whitespace", () => {
    render(<ShieldFigure variant="kcvv" name="kcvv" />);
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("renders a logo image (and no initial) when logoUrl is provided", () => {
    const { container } = render(
      <ShieldFigure
        variant="opponent"
        name="RC Mechelen"
        logoUrl="/logos/rc.png"
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/logos/rc.png",
    );
    expect(screen.queryByText("M")).toBeNull();
  });

  it("emits data-variant + data-size attributes for styling hooks", () => {
    const { container } = render(
      <ShieldFigure variant="kcvv" name="KCVV" size="sm" />,
    );
    const root = container.querySelector('[role="img"]');
    expect(root).toHaveAttribute("data-variant", "kcvv");
    expect(root).toHaveAttribute("data-size", "sm");
  });

  it("falls back to '?' when name is empty", () => {
    render(<ShieldFigure variant="opponent" name="   " />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
