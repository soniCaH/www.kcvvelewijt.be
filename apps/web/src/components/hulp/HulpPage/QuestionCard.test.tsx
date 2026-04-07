import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import { FIXTURE_PATHS } from "./__fixtures__/paths.fixture";

const path = FIXTURE_PATHS[0]!;

describe("QuestionCard", () => {
  it("renders the question and summary", () => {
    render(<QuestionCard path={path} onClick={() => {}} />);
    expect(screen.getByText(path.question)).toBeInTheDocument();
    expect(screen.getByText(path.summary)).toBeInTheDocument();
  });

  it("calls onClick with the path id when the card is clicked", () => {
    const onClick = vi.fn();
    render(<QuestionCard path={path} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith(path.id);
  });
});
