/**
 * AccentStrip Component Tests
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AccentStrip } from "./AccentStrip";

describe("AccentStrip", () => {
  it("renders a decorative fixed bar", () => {
    const { container } = render(<AccentStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("fixed", "top-0", "left-0", "right-0");
  });
});
