import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HulpSearchInput } from "./HulpSearchInput";

describe("HulpSearchInput", () => {
  it("renders a controlled search input with the provided value", () => {
    render(<HulpSearchInput value="inschrijving" onChange={() => {}} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("inschrijving");
  });

  it("calls onChange with the new value when the user types", () => {
    const onChange = vi.fn();
    render(<HulpSearchInput value="" onChange={onChange} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "lidgeld" } });
    expect(onChange).toHaveBeenCalledWith("lidgeld");
  });

  it("uses the default placeholder and aria-label", () => {
    render(<HulpSearchInput value="" onChange={() => {}} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("inschrijving"),
    );
    expect(input).toHaveAttribute("aria-label", "Zoek hulp");
  });
});
