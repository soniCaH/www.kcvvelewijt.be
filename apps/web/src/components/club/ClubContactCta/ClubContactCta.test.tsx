import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubContactCta } from "./ClubContactCta";

describe("ClubContactCta", () => {
  it("renders title and body text", () => {
    render(<ClubContactCta />);

    expect(screen.getByText("Vragen over de club?")).toBeInTheDocument();
    expect(
      screen.getByText("Neem contact op — we helpen je graag verder."),
    ).toBeInTheDocument();
  });

  it("renders CTA button linking to /club/contact", () => {
    render(<ClubContactCta />);

    const link = screen.getByRole("link", { name: /contacteer ons/i });
    expect(link).toHaveAttribute("href", "/club/contact");
  });
});
