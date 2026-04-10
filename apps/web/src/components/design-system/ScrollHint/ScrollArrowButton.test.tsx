import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollArrowButton } from "./ScrollArrowButton";

describe("ScrollArrowButton", () => {
  it("renders a button with the correct aria-label for left direction", () => {
    render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
  });

  it("renders a button with the correct aria-label for right direction", () => {
    render(<ScrollArrowButton direction="right" onClick={vi.fn()} />);
    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ScrollArrowButton direction="right" onClick={onClick} />);

    await user.click(screen.getByLabelText("Scroll right"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies light variant classes by default", () => {
    render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
    const button = screen.getByLabelText("Scroll left");
    expect(button).toHaveClass("bg-white");
    expect(button).toHaveClass("text-kcvv-green-bright");
  });

  it("applies dark variant classes when variant is dark", () => {
    render(
      <ScrollArrowButton direction="left" onClick={vi.fn()} variant="dark" />,
    );
    const button = screen.getByLabelText("Scroll left");
    expect(button).toHaveClass("bg-white/20");
    expect(button).toHaveClass("text-white");
  });
});
