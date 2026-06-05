/**
 * RemovableChip unit tests.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RemovableChip } from "./RemovableChip";

describe("RemovableChip", () => {
  it("renders the label", () => {
    render(<RemovableChip label="A-ploeg" onRemove={vi.fn()} />);
    expect(screen.getByTestId("removable-chip")).toHaveTextContent("A-ploeg");
  });

  it("gives the remove control an accessible name including the label", () => {
    render(<RemovableChip label="A-ploeg" onRemove={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Verwijder A-ploeg" }),
    ).toBeInTheDocument();
  });

  it("uses a custom removeLabel verb when provided", () => {
    render(
      <RemovableChip label="A-ploeg" onRemove={vi.fn()} removeLabel="Wis" />,
    );
    expect(
      screen.getByRole("button", { name: "Wis A-ploeg" }),
    ).toBeInTheDocument();
  });

  it("calls onRemove when the × control is pressed", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RemovableChip label="A-ploeg" onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "Verwijder A-ploeg" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("applies the outline tone classes", () => {
    render(<RemovableChip label="A-ploeg" onRemove={vi.fn()} tone="outline" />);
    expect(screen.getByTestId("removable-chip").className).toContain(
      "bg-cream",
    );
  });
});
