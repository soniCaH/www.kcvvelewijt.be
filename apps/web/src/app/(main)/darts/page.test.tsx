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
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // The block closes itself after the event day, so the clock is pinned to a
  // day before it for every test that expects the form.
  const beforeEventDay = () =>
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-12-01T10:00:00Z"),
    });

  it("does not print the print-only legal line", () => {
    beforeEventDay();
    const { container } = render(<DartsPage />);

    expect(darts.wettelijk.regel).toBe("Verboden op de openbare weg te gooien");
    expect(container.textContent).not.toContain(darts.wettelijk.regel);
  });

  it("replaces the undecided signup placeholder with the form", () => {
    beforeEventDay();
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

  it("links the hero button to the signup block while it is open", () => {
    beforeEventDay();
    render(<DartsPage />);

    expect(screen.getByRole("link", { name: /Inschrijven/ })).toHaveAttribute(
      "href",
      "#inschrijven",
    );
  });

  it("drops the hero button together with the signup block after the event day", () => {
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-12-20T09:00:00Z"),
    });
    render(<DartsPage />);

    expect(screen.queryByRole("link", { name: /Inschrijven/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Schrijf onze ploeg in/ }),
    ).toBeNull();
  });
});
