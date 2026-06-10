import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionKicker } from "./SectionKicker";

describe("SectionKicker", () => {
  it("renders the label and a decorative trailing rule", () => {
    const { container } = render(
      <SectionKicker>Ontdek onze jeugd</SectionKicker>,
    );
    expect(screen.getByText("Ontdek onze jeugd")).toBeInTheDocument();
    const rule = container.querySelector('[aria-hidden="true"]');
    expect(rule).toBeInTheDocument();
    expect(rule).toHaveClass("flex-1");
  });

  it("forwards className to the row wrapper", () => {
    const { container } = render(
      <SectionKicker className="mb-8">Hoofdsponsors</SectionKicker>,
    );
    expect(container.firstElementChild).toHaveClass("mb-8");
  });
});
