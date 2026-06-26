/**
 * SearchAnswerCard Component Tests
 *
 * Focus: the variant C a11y/tone guardrails (8s5 LOCKED) — decorative postmark
 * out of the accessible name, legible disclaimer, real focusable source links,
 * and the answer-length clamp.
 */

import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchAnswerCard } from "./SearchAnswerCard";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const SOURCES = [
  { title: "Word lid", href: "/club/inschrijven" },
  { title: "Jeugdwerking", href: "/club/jeugd" },
];

describe("SearchAnswerCard", () => {
  it("renders the answer prose", () => {
    render(
      <SearchAnswerCard answer="Laat je interesse achter." sources={[]} />,
    );

    expect(screen.getByText("Laat je interesse achter.")).toBeInTheDocument();
  });

  it("renders sources as real keyboard-focusable links", () => {
    render(<SearchAnswerCard answer="Antwoord" sources={SOURCES} />);

    const link = screen.getByRole("link", { name: "Word lid" });
    expect(link).toHaveAttribute("href", "/club/inschrijven");
    expect(screen.getByRole("link", { name: "Jeugdwerking" })).toHaveAttribute(
      "href",
      "/club/jeugd",
    );
  });

  it("shows the AI disclaimer", () => {
    render(<SearchAnswerCard answer="Antwoord" sources={[]} />);

    expect(
      screen.getByText(/door ai samengevat uit onze pagina's/i),
    ).toBeInTheDocument();
  });

  it("marks the decorative postmark aria-hidden", () => {
    render(<SearchAnswerCard answer="Antwoord" sources={[]} />);

    // The decorative "Slim" postmark is aria-hidden; the inline mono
    // "Slim antwoord" label is what stays exposed to AT.
    expect(screen.getByText("Slim", { exact: true })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("Slim antwoord")).toBeInTheDocument();
  });

  it("clamps an over-long answer at a word boundary", () => {
    const longAnswer = `${"woord ".repeat(120)}einde`;
    render(<SearchAnswerCard answer={longAnswer} sources={[]} />);

    const quote = screen.getByText(/^woord woord/);
    expect(quote.textContent).toMatch(/…$/);
    expect(quote.textContent!.length).toBeLessThanOrEqual(321);
    // No mid-word cut — the clamped text ends on whole words.
    expect(quote.textContent).not.toMatch(/woor…$/);
  });

  it("renders no source list when there are no sources", () => {
    render(<SearchAnswerCard answer="Antwoord" sources={[]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
