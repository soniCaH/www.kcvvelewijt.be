import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KalenderFilterBar } from "./KalenderFilterBar";

describe("<KalenderFilterBar>", () => {
  it("renders the reset + Wedstrijden chips plus a chip per event type", () => {
    render(<KalenderFilterBar selected="all" onSelect={vi.fn()} />);

    for (const label of [
      "Alles",
      "Wedstrijden",
      "Clubevent",
      "Supportersactiviteit",
      "Jeugdwerking",
      "Andere",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("exposes a labelled group for the filter row", () => {
    render(<KalenderFilterBar selected="all" onSelect={vi.fn()} />);

    expect(
      screen.getByRole("group", { name: /filter kalender op type/i }),
    ).toBeInTheDocument();
  });

  it("marks only the selected chip as pressed", () => {
    render(<KalenderFilterBar selected="Wedstrijden" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Wedstrijden" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Alles" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Clubevent" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSelect with 'Wedstrijden' when the matches chip is pressed", async () => {
    const onSelect = vi.fn();
    render(<KalenderFilterBar selected="all" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Wedstrijden" }));

    expect(onSelect).toHaveBeenCalledWith("Wedstrijden");
  });

  it("calls onSelect with the event-type value when a type chip is pressed", async () => {
    const onSelect = vi.fn();
    render(<KalenderFilterBar selected="all" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Jeugdwerking" }));

    expect(onSelect).toHaveBeenCalledWith("Jeugdwerking");
  });

  it('calls onSelect with "all" when the reset chip is pressed', async () => {
    const onSelect = vi.fn();
    render(<KalenderFilterBar selected="Wedstrijden" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Alles" }));

    expect(onSelect).toHaveBeenCalledWith("all");
  });
});
