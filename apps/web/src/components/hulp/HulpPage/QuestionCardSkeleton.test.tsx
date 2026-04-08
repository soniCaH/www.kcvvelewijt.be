/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  QuestionCardSkeleton,
  QuestionCardSkeletonGrid,
} from "./QuestionCardSkeleton";

describe("QuestionCardSkeleton", () => {
  it("renders a placeholder card with the QuestionCard shape", () => {
    const { container } = render(<QuestionCardSkeleton />);
    expect(container.firstChild).toHaveClass(
      "flex",
      "w-full",
      "items-start",
      "gap-4",
      "rounded-sm",
      "border",
      "border-gray-200",
      "bg-white",
      "p-4",
    );
  });
});

describe("QuestionCardSkeletonGrid", () => {
  it("renders 4 skeleton cards by default", () => {
    const { container } = render(<QuestionCardSkeletonGrid />);
    const cards = container.querySelectorAll(
      ".rounded-sm.border.border-gray-200.bg-white",
    );
    expect(cards).toHaveLength(4);
  });

  it("respects the count prop", () => {
    const { container } = render(<QuestionCardSkeletonGrid count={6} />);
    const cards = container.querySelectorAll(
      ".rounded-sm.border.border-gray-200.bg-white",
    );
    expect(cards).toHaveLength(6);
  });

  it("has accessible loading semantics", () => {
    render(<QuestionCardSkeletonGrid />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Zoeken naar resultaten...")).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    render(<QuestionCardSkeletonGrid label="Hulppagina laden..." />);
    expect(screen.getByText("Hulppagina laden...")).toBeInTheDocument();
  });

  it("applies animate-pulse to the wrapper for synchronized animation", () => {
    const { container } = render(<QuestionCardSkeletonGrid />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });
});
