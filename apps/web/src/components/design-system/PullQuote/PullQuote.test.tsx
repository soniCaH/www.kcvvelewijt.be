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
    expect(screen.getByText("MAXIM")).toBeInTheDocument();
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

  it("renders a QuoteMark glyph", () => {
    const { container } = render(
      <PullQuote attribution={{ name: "x" }}>x</PullQuote>,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
