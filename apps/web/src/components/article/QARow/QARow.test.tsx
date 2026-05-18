import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QARow, type QARowRespondent } from "./QARow";

function respondent(overrides: Partial<QARowRespondent> = {}): QARowRespondent {
  return {
    firstName: "Lars",
    fullName: "Lars Janssens",
    role: "AANVALLER",
    answer: "Halfweg de eerste helft tegen Tervuren.",
    ...overrides,
  };
}

describe("<QARow>", () => {
  describe("single-respondent", () => {
    it("renders single-mode when respondents has exactly 1 entry", () => {
      const { container } = render(
        <QARow question="Wat veranderde er?" respondents={[respondent()]} />,
      );
      const row = container.firstElementChild as HTMLElement;
      expect(row.getAttribute("data-qa-row-mode")).toBe("single");
    });

    it("renders the speaker first name in the mono caps tag", () => {
      const { container } = render(
        <QARow
          question="Wat was het moment dat alles draaide?"
          respondents={[
            respondent({
              firstName: "Lars",
              fullName: "Lars Janssens",
              role: "AANVALLER",
            }),
          ]}
        />,
      );
      const tag = container.querySelector('[data-qa-row="speaker-tag"]');
      expect(tag?.textContent).toContain("Lars Janssens");
      expect(tag?.textContent).toContain("AANVALLER");
    });

    it("omits the role suffix when role is not supplied", () => {
      const { container } = render(
        <QARow
          question="Q?"
          respondents={[
            respondent({
              firstName: "Lars",
              fullName: "Lars Janssens",
              role: undefined,
            }),
          ]}
        />,
      );
      const tag = container.querySelector('[data-qa-row="speaker-tag"]');
      expect(tag?.textContent?.trim()).toBe("Lars Janssens");
    });

    it("renders the question as italic display-sm via h3", () => {
      const { container } = render(
        <QARow
          question="Wat veranderde er na de winterstop?"
          respondents={[respondent()]}
        />,
      );
      const q = container.querySelector('h3[data-qa-row="question"]');
      expect(q?.textContent).toBe("Wat veranderde er na de winterstop?");
      expect(q?.className).toContain("italic");
      expect(q?.className).toContain("font-display");
      expect(q?.className).toContain("font-semibold");
    });

    it("renders the answer ReactNode inside the answer slot", () => {
      const { container } = render(
        <QARow
          question="Q?"
          respondents={[
            respondent({
              answer: (
                <p>
                  Geen drama. Gewoon <em>doorgaan</em>.
                </p>
              ),
            }),
          ]}
        />,
      );
      const answer = container.querySelector('[data-qa-row="answer"]');
      expect(answer?.querySelector("em")?.textContent).toBe("doorgaan");
    });

    it("places the avatar + speaker tag in a header, question indented below", () => {
      const { container } = render(
        <QARow question="Q?" respondents={[respondent({ firstName: "L" })]} />,
      );
      const header = container.querySelector("header");
      expect(header?.className).toContain("items-center");
      const body = container.querySelector(
        '[data-qa-row="question"]',
      )?.parentElement;
      expect(body?.className).toContain("pl-11");
    });

    it("renders the monogram avatar at row scale", () => {
      const { container } = render(
        <QARow question="Q?" respondents={[respondent()]} />,
      );
      expect(
        container.querySelector(
          '[data-subject-avatar="monogram"][data-scale="row"]',
        ),
      ).not.toBeNull();
    });

    it("returns null when respondents is empty", () => {
      const { container } = render(<QARow question="Q?" respondents={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("multi-respondent", () => {
    const TWO_RESPONDENTS: QARowRespondent[] = [
      respondent({
        firstName: "Lars",
        fullName: "Lars Janssens",
        role: "AANVALLER",
        answer: "Halfweg de eerste helft tegen Tervuren.",
        respondentKey: "lars",
      }),
      respondent({
        firstName: "Niels",
        fullName: "Niels Peeters",
        role: "MIDDENVELDER",
        answer: "Voor mij was het de zaalstage.",
        respondentKey: "niels",
      }),
    ];

    it("renders multi-mode when respondents has more than 1 entry", () => {
      const { container } = render(
        <QARow question="Wat veranderde er?" respondents={TWO_RESPONDENTS} />,
      );
      const row = container.firstElementChild as HTMLElement;
      expect(row.getAttribute("data-qa-row-mode")).toBe("multi");
      expect(row.getAttribute("data-qa-row-respondent-count")).toBe("2");
    });

    it("renders the question once, full-width above respondents", () => {
      const { container } = render(
        <QARow question="Wat veranderde er?" respondents={TWO_RESPONDENTS} />,
      );
      const questions = container.querySelectorAll(
        'h3[data-qa-row="question"]',
      );
      expect(questions).toHaveLength(1);
      expect(questions[0]?.textContent).toBe("Wat veranderde er?");
    });

    it("renders one respondent block per entry with stable keys", () => {
      const { container } = render(
        <QARow question="Q?" respondents={TWO_RESPONDENTS} />,
      );
      const blocks = container.querySelectorAll('[data-qa-row="respondent"]');
      expect(blocks).toHaveLength(2);
      expect(blocks[0]?.getAttribute("data-qa-row-respondent-index")).toBe("0");
      expect(blocks[1]?.getAttribute("data-qa-row-respondent-index")).toBe("1");
    });

    it("renders each respondent's speaker tag", () => {
      const { container } = render(
        <QARow question="Q?" respondents={TWO_RESPONDENTS} />,
      );
      const tags = container.querySelectorAll('[data-qa-row="speaker-tag"]');
      expect(tags).toHaveLength(2);
      expect(tags[0]?.textContent).toContain("Lars Janssens");
      expect(tags[1]?.textContent).toContain("Niels Peeters");
    });

    it("renders each respondent's answer in body-md", () => {
      const { container } = render(
        <QARow question="Q?" respondents={TWO_RESPONDENTS} />,
      );
      const answers = container.querySelectorAll('[data-qa-row="answer"]');
      expect(answers).toHaveLength(2);
      expect(answers[0]?.textContent).toContain(
        "Halfweg de eerste helft tegen Tervuren.",
      );
      expect(answers[1]?.textContent).toContain(
        "Voor mij was het de zaalstage.",
      );
    });

    it("renders 3+ respondents", () => {
      const three: QARowRespondent[] = [
        ...TWO_RESPONDENTS,
        respondent({
          firstName: "Wim",
          fullName: "Wim Govaerts",
          role: "TRAINER",
          answer: "Het ging om geduld.",
          respondentKey: "wim",
        }),
      ];
      const { container } = render(<QARow question="Q?" respondents={three} />);
      expect(
        container.querySelectorAll('[data-qa-row="respondent"]'),
      ).toHaveLength(3);
    });
  });
});
