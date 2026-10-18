import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import UltrasPage from "./page";
import { ULTRAS_HERO } from "./copy";

describe("/club/ultras page", () => {
  it("renders the photo-led opening", () => {
    render(<UltrasPage />);

    expect(screen.getByText(/Supportersclub · Ultra's 55/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /de luidste hoek/i }),
    ).toBeInTheDocument();
    // Decorative (alt=""), so it has no img role to query by.
    expect(
      screen.getByTestId("ultras-hero").querySelector("img"),
    ).toHaveAttribute("alt", "");
  });

  it("renders the up-link to /club", () => {
    render(<UltrasPage />);

    const upLink = screen.getByTestId("up-link");
    expect(upLink).toHaveAttribute("href", "/club");
    expect(upLink).toHaveTextContent("De club");
  });

  it("renders editorial sections below the hero", () => {
    render(<UltrasPage />);

    expect(screen.getByText("Wie zijn we")).toBeInTheDocument();
    expect(screen.getByText("Wat doen we")).toBeInTheDocument();
    expect(screen.getByText("Lid worden")).toBeInTheDocument();
  });

  it("measures its running text at the prose token, leaving media at container width", () => {
    render(<UltrasPage />);

    // #2436: only direct-child <p> clamp to the prose token. jsdom does not
    // resolve the arbitrary variant, so assert both halves of what makes it
    // apply — the copy is a <p>, and its direct parent carries the clamp.
    const paragraph = screen.getByText(/De naam KCVV Ultras werd/);
    expect(paragraph.tagName).toBe("P");
    expect(paragraph.parentElement?.className).toContain(
      "[&>p]:max-w-[var(--container-prose)]",
    );
  });

  // #2547 rule 1 — the visible text already is the destination
  // ("facebook.com/KCVV.ULTRAS.55"), so the control earns no external mark;
  // the old literal ↗ dies.
  it("carries no literal external-arrow character on the Facebook CTA", () => {
    render(<UltrasPage />);
    const cta = screen.getByRole("link", {
      name: /facebook\.com\/kcvv\.ultras\.55/i,
    });
    expect(cta.textContent).not.toContain("↗");
  });

  it("opens the Facebook join link in a new tab and tags it for ultras_join_click", () => {
    render(<UltrasPage />);
    const cta = screen.getByRole("link", {
      name: /facebook\.com\/kcvv\.ultras\.55/i,
    });
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    expect(cta).toHaveAttribute("data-ultras-join");
  });

  // EditorialHeading drops an emphasis it cannot find, silently.
  it("accents a word the headline actually contains", () => {
    expect(ULTRAS_HERO.headline).toContain(ULTRAS_HERO.accent);
  });

  it("renders the raffle callout stats", () => {
    render(<UltrasPage />);

    // Scope to the callout — "500"/"750" also appear in the body prose, so a
    // page-wide text match would be ambiguous.
    const callout = within(screen.getByTestId("raffle-callout"));
    expect(callout.getByText("500")).toBeInTheDocument();
    expect(callout.getByText("750")).toBeInTheDocument();
  });
});
