import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TextareaCounter } from "./TextareaCounter";

describe("TextareaCounter", () => {
  it("renders current/max digits", () => {
    render(<TextareaCounter current={58} max={240} />);
    expect(screen.getByText("58/240")).toBeInTheDocument();
  });

  it("uses ink/60 color when within the limit", () => {
    render(<TextareaCounter current={58} max={240} />);
    const el = screen.getByText("58/240");
    expect(el.className).toContain("text-ink/60");
    expect(el.className).not.toContain("text-alert");
    expect(el).not.toHaveAttribute("data-over");
  });

  it("flips to text-alert when over the limit", () => {
    render(<TextareaCounter current={241} max={240} />);
    const el = screen.getByText("241/240");
    expect(el.className).toContain("text-alert");
    expect(el).toHaveAttribute("data-over", "true");
  });

  it("treats current === max as within the limit", () => {
    render(<TextareaCounter current={240} max={240} />);
    expect(screen.getByText("240/240").className).toContain("text-ink/60");
  });

  it("renders as aria-hidden — not a screen-reader signal", () => {
    render(<TextareaCounter current={1} max={2} />);
    expect(screen.getByText("1/2")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses font-mono with tabular-nums for stable digit width", () => {
    render(<TextareaCounter current={1} max={2} />);
    const el = screen.getByText("1/2");
    expect(el).toHaveClass("font-mono");
    expect(el).toHaveClass("tabular-nums");
  });
});
