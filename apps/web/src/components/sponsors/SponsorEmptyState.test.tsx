import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SponsorEmptyState } from "./SponsorEmptyState";

describe("SponsorEmptyState", () => {
  it("renders a gracious heading and message", () => {
    render(<SponsorEmptyState />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Nog geen sponsors.",
    );
    expect(screen.getByText(/We zoeken partners/i)).toBeInTheDocument();
  });

  it("does not render its own CTA (the band owns the action)", () => {
    render(<SponsorEmptyState />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
