import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { ResponsibilityPath } from "@/types/responsibility";

const path: ResponsibilityPath = {
  id: "inschrijven",
  category: "administratief",
  role: [],
  question: "Hoe schrijf ik mijn kind in?",
  keywords: [],
  summary: "Inschrijven kan het hele seizoen door.",
  steps: [
    { description: "Mail de jeugdsecretaris." },
    { description: "Vul het formulier in.", link: "/inschrijven" },
  ],
  primaryContact: {
    contactType: "manual",
    role: "Jeugdsecretaris",
    email: "jeugd@kcvvelewijt.be",
  },
};

const noop = () => {};

describe("QuestionCard", () => {
  it("always renders the question; reveals the answer only when open", () => {
    const { rerender } = render(
      <QuestionCard path={path} open={false} onToggle={noop} />,
    );
    const button = screen.getByRole("button", {
      name: /hoe schrijf ik mijn kind in/i,
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/inschrijven kan het hele seizoen/i),
    ).not.toBeInTheDocument();

    rerender(<QuestionCard path={path} open onToggle={noop} />);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/inschrijven kan het hele seizoen/i),
    ).toBeInTheDocument();
  });

  it("calls onToggle when the header is activated", () => {
    const onToggle = vi.fn();
    render(<QuestionCard path={path} open={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /hoe schrijf ik/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders numbered steps with their inline links when open", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    expect(screen.getByText("Mail de jeugdsecretaris.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meer info/i })).toHaveAttribute(
      "href",
      "/inschrijven",
    );
  });

  it("renders the contact in the person vocab inside the answer", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    expect(screen.getByText("Jeugdsecretaris")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /e-mail/i })).toHaveAttribute(
      "href",
      "mailto:jeugd@kcvvelewijt.be",
    );
  });

  it("links the answer panel to the header via aria-controls (accordion a11y)", () => {
    render(<QuestionCard path={path} open onToggle={noop} />);
    const button = screen.getByRole("button", { name: /hoe schrijf ik/i });
    const panelId = button.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toBeInTheDocument();
  });
});
