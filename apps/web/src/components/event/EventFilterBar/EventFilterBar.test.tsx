import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EventFilterBar } from "./EventFilterBar";

describe("<EventFilterBar>", () => {
  it("renders the reset chip plus a chip per event type", () => {
    render(<EventFilterBar selected="all" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Alles" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clubevent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Supportersactiviteit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Jeugdwerking" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Andere" })).toBeInTheDocument();
  });

  it("exposes a labelled group for the filter row", () => {
    render(<EventFilterBar selected="all" onSelect={vi.fn()} />);

    expect(
      screen.getByRole("group", { name: /filter evenementen op type/i }),
    ).toBeInTheDocument();
  });

  it("marks only the selected chip as pressed", () => {
    render(<EventFilterBar selected="Jeugdwerking" onSelect={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Jeugdwerking" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Alles" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Clubevent" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSelect with the chip value when a type chip is pressed", async () => {
    const onSelect = vi.fn();
    render(<EventFilterBar selected="all" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Clubevent" }));

    expect(onSelect).toHaveBeenCalledWith("Clubevent");
  });

  it('calls onSelect with "all" when the reset chip is pressed', async () => {
    const onSelect = vi.fn();
    render(<EventFilterBar selected="Clubevent" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Alles" }));

    expect(onSelect).toHaveBeenCalledWith("all");
  });
});
