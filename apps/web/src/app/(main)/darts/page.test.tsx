import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DartsPage from "./page";
import darts from "@/data/darts.json";

vi.mock("@/components/club/MembershipForm/TurnstileWidget", () => ({
  TurnstileWidget: () => null,
}));

describe("/darts", () => {
  // The signup block reads the spots left on mount; keep it off the network.
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ spotsLeft: 24 }))),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does not print the print-only legal line", () => {
    const { container } = render(<DartsPage />);

    expect(darts.wettelijk.regel).toBe("Verboden op de openbare weg te gooien");
    expect(container.textContent).not.toContain(darts.wettelijk.regel);
  });

  it("replaces the undecided signup placeholder with the form", () => {
    const { container } = render(<DartsPage />);

    expect(container.textContent).not.toContain("Binnenkort via deze pagina");
    expect(
      screen.getByRole("button", { name: /Schrijf onze ploeg in/ }),
    ).toBeInTheDocument();
  });

  it("shows the hours from the facts file", () => {
    render(<DartsPage />);

    expect(screen.getByText(darts.uren.deuren)).toBeInTheDocument();
    expect(screen.getByText(darts.uren.eersteWorp)).toBeInTheDocument();
  });
});
