import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonoLabel } from "./MonoLabel";

describe("MonoLabel", () => {
  it("renders children", () => {
    render(<MonoLabel>interview</MonoLabel>);
    expect(screen.getByText("interview")).toBeInTheDocument();
  });

  it("default variant is 'plain' and size is 'sm'", () => {
    const { container } = render(<MonoLabel>X</MonoLabel>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-variant", "plain");
    expect(el).toHaveAttribute("data-size", "sm");
  });

  it("variant pill-jersey sets data-variant", () => {
    const { container } = render(
      <MonoLabel variant="pill-jersey">X</MonoLabel>,
    );
    expect(container.firstChild).toHaveAttribute("data-variant", "pill-jersey");
  });

  it("size md sets data-size", () => {
    const { container } = render(<MonoLabel size="md">X</MonoLabel>);
    expect(container.firstChild).toHaveAttribute("data-size", "md");
  });
});
