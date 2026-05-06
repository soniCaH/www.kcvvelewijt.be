import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlayerFigure } from "./PlayerFigure";

const BASE_PLAYER = {
  firstName: "Maxim",
  lastName: "Breugelmans",
  position: "Middenvelder",
  jerseyNumber: 8,
} as const;

describe("PlayerFigure", () => {
  it("renders the photo state when photoUrl is supplied", () => {
    const { container } = render(
      <PlayerFigure
        {...BASE_PLAYER}
        photoUrl="https://example.com/maxim.jpg"
      />,
    );
    const figure = container.querySelector("[data-playerfigure-state]");
    expect(figure).toHaveAttribute("data-playerfigure-state", "photo");
    expect(screen.getByAltText("Maxim Breugelmans")).toBeInTheDocument();
    expect(
      screen.getByText("★ KCVV ELEWIJT · SEIZOEN 25–26"),
    ).toBeInTheDocument();
  });

  it("renders the illustration state when photoUrl is missing", () => {
    const { container } = render(<PlayerFigure {...BASE_PLAYER} />);
    expect(
      container.querySelector("[data-playerfigure-state]"),
    ).toHaveAttribute("data-playerfigure-state", "illustration");
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    // Caption renders dynamic player chrome (jersey #, name).
    expect(container.textContent).toContain("Maxim Breugelmans");
  });

  it("treats an empty-string photoUrl as missing", () => {
    const { container } = render(<PlayerFigure {...BASE_PLAYER} photoUrl="" />);
    expect(
      container.querySelector("[data-playerfigure-state]"),
    ).toHaveAttribute("data-playerfigure-state", "illustration");
  });

  it("never renders a photo well inside the illustration state (no Mickey-Mouse hybrid)", () => {
    const { container } = render(<PlayerFigure {...BASE_PLAYER} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("never renders the drawn figure when a photo is present", () => {
    const { container } = render(
      <PlayerFigure
        {...BASE_PLAYER}
        photoUrl="https://example.com/maxim.jpg"
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("falls back to positionPsd when position is empty", () => {
    render(
      <PlayerFigure
        firstName="Maxim"
        lastName="Breugelmans"
        positionPsd="Aanvaller"
      />,
    );
    expect(screen.getByText("Aanvaller")).toBeInTheDocument();
  });

  it("renders the side meta column the same in both states", () => {
    const photo = render(
      <PlayerFigure
        {...BASE_PLAYER}
        photoUrl="https://example.com/maxim.jpg"
        bio="Linkse spits met een neus voor de tweede paal."
      />,
    );
    const photoMeta = photo.container.querySelector(
      '[data-playerfigure="meta"]',
    );
    photo.unmount();

    const illus = render(
      <PlayerFigure
        {...BASE_PLAYER}
        bio="Linkse spits met een neus voor de tweede paal."
      />,
    );
    const illusMeta = illus.container.querySelector(
      '[data-playerfigure="meta"]',
    );

    expect(photoMeta?.textContent).toBe(illusMeta?.textContent);
  });

  it("drops bio when empty after trim", () => {
    const { container } = render(<PlayerFigure {...BASE_PLAYER} bio="   " />);
    expect(container.querySelectorAll("p.italic")).toHaveLength(0);
  });

  it("truncates a long bio to 120 chars with an ellipsis", () => {
    const longBio = "a".repeat(200);
    const { container } = render(
      <PlayerFigure {...BASE_PLAYER} bio={longBio} />,
    );
    const bio = container.querySelector("p.italic");
    expect(bio?.textContent?.length).toBeLessThanOrEqual(120);
    expect(bio?.textContent?.endsWith("…")).toBe(true);
  });

  it("renders a string tag as a plain MonoLabel", () => {
    render(<PlayerFigure {...BASE_PLAYER} tag="SPELER VAN DE WEEK" />);
    expect(screen.getByText("SPELER VAN DE WEEK")).toBeInTheDocument();
  });

  it("maps tag tone='jersey' to the pill-jersey MonoLabel variant", () => {
    const { container } = render(
      <PlayerFigure {...BASE_PLAYER} tag={{ text: "NIEUW", tone: "jersey" }} />,
    );
    const pill = container.querySelector('[data-variant="pill-jersey"]');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toBe("NIEUW");
  });

  it("renders teamLabel inline with position when supplied", () => {
    render(<PlayerFigure {...BASE_PLAYER} teamLabel="A-PLOEG" />);
    expect(screen.getByText("A-PLOEG · Middenvelder")).toBeInTheDocument();
  });
});
