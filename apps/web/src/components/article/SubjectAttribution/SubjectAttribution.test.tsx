import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubjectAttribution } from "./SubjectAttribution";
import type { SubjectValue } from "./resolveSubject";

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

const staffSubject: SubjectValue = {
  kind: "staff",
  staffRef: {
    firstName: "Koen",
    lastName: "Dewaele",
    functionTitle: "Hoofdcoach",
    photoUrl: null,
  },
};

const customSubject: SubjectValue = {
  kind: "custom",
  customName: "Luc Janssens",
  customRole: "Oud-speler",
  customPhotoUrl: null,
};

describe("SubjectAttribution", () => {
  it("renders the quote variant for a player with jersey number shown after a separator", () => {
    render(<SubjectAttribution subject={playerSubject} variant="quote" />);
    const el = screen.getByTestId("subject-attribution-quote");
    expect(el).toHaveTextContent("Maxim Breugelmans");
    expect(el).toHaveTextContent("#9");
  });

  it("renders the key variant with a mono jersey numeral for player subjects", () => {
    render(<SubjectAttribution subject={playerSubject} variant="key" />);
    const el = screen.getByTestId("subject-attribution-key");
    expect(el).toHaveTextContent("#9");
    expect(el).toHaveTextContent("Maxim Breugelmans");
  });

  it("renders staff subjects without a jersey numeral", () => {
    const { container } = render(
      <SubjectAttribution subject={staffSubject} variant="key" />,
    );
    expect(container.textContent).toContain("Koen Dewaele");
    expect(container.textContent).toContain("Hoofdcoach");
    expect(container.textContent).not.toContain("#");
  });

  it("renders custom subjects with customName and customRole", () => {
    const { container } = render(
      <SubjectAttribution subject={customSubject} variant="quote" />,
    );
    expect(container.textContent).toContain("Luc Janssens");
    expect(container.textContent).toContain("Oud-speler");
  });

  it("renders nothing when subject is null", () => {
    const { container } = render(
      <SubjectAttribution subject={null} variant="quote" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
