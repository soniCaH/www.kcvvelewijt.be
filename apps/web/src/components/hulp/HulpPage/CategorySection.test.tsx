import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategorySection } from "./CategorySection";
import { FIXTURE_PATHS } from "./__fixtures__/paths.fixture";

const adminPaths = FIXTURE_PATHS.filter((p) => p.category === "administratief");

describe("CategorySection", () => {
  it("renders the category label and count", () => {
    render(
      <CategorySection
        category="administratief"
        paths={adminPaths}
        onPathClick={() => {}}
      />,
    );
    expect(screen.getByText("Administratief")).toBeInTheDocument();
    expect(screen.getByText(`(${adminPaths.length})`)).toBeInTheDocument();
  });

  it("renders one QuestionCard per path and forwards clicks", () => {
    const onPathClick = vi.fn();
    render(
      <CategorySection
        category="administratief"
        paths={adminPaths}
        onPathClick={onPathClick}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(adminPaths.length);
    fireEvent.click(buttons[0]!);
    expect(onPathClick).toHaveBeenCalledWith(adminPaths[0]!.id);
  });

  it("renders nothing when paths is empty", () => {
    const { container } = render(
      <CategorySection
        category="commercieel"
        paths={[]}
        onPathClick={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
