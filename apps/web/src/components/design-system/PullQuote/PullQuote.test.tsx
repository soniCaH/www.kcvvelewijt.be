import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PullQuote } from "./PullQuote";

describe("PullQuote", () => {
  it("renders the quoted body inside <q>", () => {
    render(
      <PullQuote attribution={{ name: "Maxim" }}>
        Eindelijk weer een zege
      </PullQuote>,
    );
    const q = screen.getByText("Eindelijk weer een zege").closest("q");
    expect(q).not.toBeNull();
  });

  it("renders the attribution name", () => {
    render(<PullQuote attribution={{ name: "Maxim" }}>x</PullQuote>);
    // MonoLabel applies CSS uppercase — the DOM text retains original case.
    expect(screen.getByText("Maxim")).toBeInTheDocument();
  });

  it("renders role and source when provided", () => {
    render(
      <PullQuote
        attribution={{ name: "Maxim", role: "A-PLOEG", source: "INTERVIEW" }}
      >
        x
      </PullQuote>,
    );
    expect(screen.getByText("A-PLOEG")).toBeInTheDocument();
    expect(screen.getByText("INTERVIEW")).toBeInTheDocument();
  });

  it("default tone is cream", () => {
    const { container } = render(
      <PullQuote attribution={{ name: "x" }}>x</PullQuote>,
    );
    expect(
      container.querySelector('[data-pull-quote-tone="cream"]'),
    ).not.toBeNull();
  });

  it("tone='ink' applies ink tone data attribute", () => {
    const { container } = render(
      <PullQuote tone="ink" attribution={{ name: "x" }}>
        x
      </PullQuote>,
    );
    expect(
      container.querySelector('[data-pull-quote-tone="ink"]'),
    ).not.toBeNull();
  });

  it("tone='jersey' applies jersey tone data attribute", () => {
    const { container } = render(
      <PullQuote tone="jersey" attribution={{ name: "x" }}>
        x
      </PullQuote>,
    );
    expect(
      container.querySelector('[data-pull-quote-tone="jersey"]'),
    ).not.toBeNull();
  });

  it("emphasis wraps the matched substring in <HighlighterStroke> (no font change)", () => {
    const { container } = render(
      <PullQuote attribution={{ name: "x" }} emphasis={{ text: "tribune" }}>
        Een tribune die zingt is meer waard
      </PullQuote>,
    );
    expect(container.querySelector("[data-highlighter-stroke]")).not.toBeNull();
    // No <em> — the emphasis is the highlighter alone; font stays italic body.
    expect(container.querySelector("em")).toBeNull();
  });

  describe("avatarSlot layout (5.d2 lock)", () => {
    it("renders the avatar slot when provided", () => {
      const { container } = render(
        <PullQuote
          attribution={{ name: "Wim", role: "TRAINER" }}
          avatarSlot={<div data-testid="custom-avatar">avatar</div>}
        >
          x
        </PullQuote>,
      );
      expect(
        container.querySelector('[data-testid="custom-avatar"]'),
      ).not.toBeNull();
    });

    it("flips the attribution name to italic display when an avatar slot is supplied", () => {
      const { container } = render(
        <PullQuote
          attribution={{ name: "Wim" }}
          avatarSlot={<span data-testid="avatar" />}
        >
          x
        </PullQuote>,
      );
      const nameEl = container.querySelector(
        '[data-pull-quote-name="display"]',
      );
      expect(nameEl).not.toBeNull();
      expect(nameEl?.className).toContain("font-display");
      expect(nameEl?.className).toContain("italic");
      expect(nameEl?.textContent).toBe("Wim");
    });

    it("renders role + source on a separate line beside the avatar", () => {
      render(
        <PullQuote
          attribution={{
            name: "Wim",
            role: "TRAINER",
            source: "SEIZOEN 25-26",
          }}
          avatarSlot={<span data-testid="avatar" />}
        >
          x
        </PullQuote>,
      );
      expect(screen.getByText("TRAINER")).toBeInTheDocument();
      expect(screen.getByText("SEIZOEN 25-26")).toBeInTheDocument();
    });

    it("falls back to inline mono caps row when no avatar slot is supplied", () => {
      const { container } = render(
        <PullQuote attribution={{ name: "Wim", role: "TRAINER" }}>x</PullQuote>,
      );
      expect(
        container.querySelector('[data-pull-quote-name="display"]'),
      ).toBeNull();
    });
  });
});
