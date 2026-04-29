import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NumberDisplay } from "./NumberDisplay";

describe("NumberDisplay", () => {
  it("renders the value as text", () => {
    render(<NumberDisplay value={8} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("renders a string value verbatim", () => {
    render(<NumberDisplay value="2374" />);
    expect(screen.getByText("2374")).toBeInTheDocument();
  });

  it("default size is display-xl, tone is ink, as is span", () => {
    const { container } = render(<NumberDisplay value={1} />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("data-size", "display-xl");
    expect(root).toHaveAttribute("data-tone", "ink");
    expect(root.tagName).toBe("SPAN");
  });

  it("respects size prop", () => {
    const { container } = render(
      <NumberDisplay value={1} size="display-2xl" />,
    );
    expect(container.firstChild).toHaveAttribute("data-size", "display-2xl");
  });

  it("respects tone prop", () => {
    const { container } = render(<NumberDisplay value={1} tone="jersey" />);
    expect(container.firstChild).toHaveAttribute("data-tone", "jersey");
  });

  it("renders prefix when provided", () => {
    render(<NumberDisplay value={8} prefix="#" />);
    expect(screen.getByText("#")).toBeInTheDocument();
  });

  it("renders suffix when provided", () => {
    render(<NumberDisplay value={28} suffix="+" />);
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<NumberDisplay value={28} label="WEDSTRIJDEN" />);
    expect(screen.getByText("WEDSTRIJDEN")).toBeInTheDocument();
  });

  it("as='div' renders <div>", () => {
    const { container } = render(<NumberDisplay value={1} as="div" />);
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });

  it("as='p' renders <p>", () => {
    const { container } = render(<NumberDisplay value={1} as="p" />);
    expect((container.firstChild as HTMLElement).tagName).toBe("P");
  });

  it("merges className", () => {
    const { container } = render(
      <NumberDisplay value={1} className="custom-num" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-num",
    );
  });
});
