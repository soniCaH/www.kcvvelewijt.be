import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnswerCard } from "./AnswerCard";
import { FIXTURE_PATHS } from "./__fixtures__/paths.fixture";

const manualPath = FIXTURE_PATHS[0]!; // lidgeld-inschrijving — manual contact + step.link
const positionPath = FIXTURE_PATHS[1]!; // sportongeval-jeugd — position contact

describe("AnswerCard", () => {
  it("renders the question, summary and category label", () => {
    render(<AnswerCard path={manualPath} onBackClick={() => {}} />);
    expect(
      screen.getByRole("heading", { name: manualPath.question }),
    ).toBeInTheDocument();
    expect(screen.getByText(manualPath.summary)).toBeInTheDocument();
    expect(screen.getByText("Administratief")).toBeInTheDocument();
  });

  it("renders the resolved contact card", () => {
    render(<AnswerCard path={manualPath} onBackClick={() => {}} />);
    expect(screen.getByText("Contactpersoon")).toBeInTheDocument();
    expect(screen.getByText("Secretariaat")).toBeInTheDocument();
  });

  it("renders all steps in order with their numbers", () => {
    render(<AnswerCard path={manualPath} onBackClick={() => {}} />);
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(manualPath.steps.length);
    expect(steps[0]).toHaveTextContent("1");
    expect(steps[0]).toHaveTextContent(manualPath.steps[0]!.description);
  });

  it("calls onBackClick when the back button is clicked", () => {
    const onBackClick = vi.fn();
    render(<AnswerCard path={manualPath} onBackClick={onBackClick} />);
    fireEvent.click(
      screen.getByRole("button", { name: /terug naar overzicht/i }),
    );
    expect(onBackClick).toHaveBeenCalled();
  });

  it("calls onStepLinkClick with the step index when an inline step link is clicked", () => {
    const onStepLinkClick = vi.fn();
    render(
      <AnswerCard
        path={manualPath}
        onBackClick={() => {}}
        onStepLinkClick={onStepLinkClick}
      />,
    );
    // The second step has step.link
    const stepLink = screen.getByRole("link", { name: /meer info/i });
    fireEvent.click(stepLink);
    expect(onStepLinkClick).toHaveBeenCalledWith(1);
  });

  it("forwards onContactClick from the contact card", () => {
    const onContactClick = vi.fn();
    render(
      <AnswerCard
        path={manualPath}
        onBackClick={() => {}}
        onContactClick={onContactClick}
      />,
    );
    fireEvent.click(
      screen.getByRole("link", { name: /secretariaat@kcvvelewijt\.be/i }),
    );
    expect(onContactClick).toHaveBeenCalledWith("email");
  });

  it("renders a position contact's resolved member name", () => {
    render(<AnswerCard path={positionPath} onBackClick={() => {}} />);
    expect(screen.getByText("Lien Wouters")).toBeInTheDocument();
    expect(screen.getByText("Jeugdcoördinator")).toBeInTheDocument();
  });
});
