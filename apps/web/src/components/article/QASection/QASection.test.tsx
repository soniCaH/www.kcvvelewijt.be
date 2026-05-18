import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QASection, type QASectionRow } from "./QASection";

function row(i: number, overrides: Partial<QASectionRow> = {}): QASectionRow {
  return {
    rowKey: `row-${i}`,
    question: `Vraag ${i}?`,
    respondents: [
      {
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer: `Antwoord ${i}.`,
      },
    ],
    ...overrides,
  };
}

describe("<QASection>", () => {
  it("returns null when rows is empty and no trailing slot is provided", () => {
    const { container } = render(<QASection rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the default Q&A MonoLabel heading", () => {
    const { container } = render(<QASection rows={[row(1)]} />);
    expect(container.textContent).toContain("Q&A");
  });

  it("skips the heading when `heading` is null", () => {
    const { container } = render(<QASection rows={[row(1)]} heading={null} />);
    const section = container.querySelector('[data-qa-section="true"]');
    // The section's own MonoLabel header (a *direct* child of the
    // <section>) is the one we care about — QARow has its own nested
    // <header> for the avatar+tag pair which we don't want to assert on.
    const sectionHeader = section
      ? Array.from(section.children).find(
          (c) => c.tagName.toLowerCase() === "header",
        )
      : undefined;
    expect(sectionHeader).toBeUndefined();
  });

  it("renders one row per item with stable keys", () => {
    const { container } = render(<QASection rows={[row(1), row(2), row(3)]} />);
    const wrappers = container.querySelectorAll(
      '[data-qa-section="row-wrapper"]',
    );
    expect(wrappers).toHaveLength(3);
  });

  it("inserts a dotted divider between adjacent rows but not after the last", () => {
    const { container } = render(<QASection rows={[row(1), row(2), row(3)]} />);
    const dividers = container.querySelectorAll(
      '[data-divider-variant="dotted"]',
    );
    expect(dividers).toHaveLength(2);
  });

  it("renders the trailing slot after the last row", () => {
    const { container } = render(
      <QASection
        rows={[row(1)]}
        trailing={<div data-testid="trailing">tail</div>}
      />,
    );
    expect(container.querySelector('[data-testid="trailing"]')).not.toBeNull();
  });

  it("renders only the trailing slot when rows is empty but trailing is set", () => {
    const { container } = render(
      <QASection rows={[]} trailing={<div data-testid="trailing">tail</div>} />,
    );
    expect(container.querySelector('[data-testid="trailing"]')).not.toBeNull();
  });

  it("pins the section width at --container-prose", () => {
    const { container } = render(<QASection rows={[row(1)]} />);
    const section = container.firstElementChild as HTMLElement;
    expect(section.style.maxWidth).toBe("var(--container-prose)");
  });
});
