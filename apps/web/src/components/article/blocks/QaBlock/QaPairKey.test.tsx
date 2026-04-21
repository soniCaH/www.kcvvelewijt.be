import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaPairKey } from "./QaPairKey";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: "ans-1",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s1", text, marks: [] }],
  },
];

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl: "https://cdn.sanity.io/psd.webp",
  },
};

describe("QaPairKey", () => {
  it("renders the question as kicker, the promoted answer, and the attribution", () => {
    render(
      <QaPairKey
        question="Je moment van de voorbije vijf jaar"
        answer={answer("Eindrondewinst tegen Kraainem.")}
        subject={playerSubject}
      />,
    );

    expect(screen.getByTestId("qa-pair-key")).toBeInTheDocument();
    expect(
      screen.getByText("Je moment van de voorbije vijf jaar"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Eindrondewinst tegen Kraainem."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("subject-attribution-key")).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("collapses to single-column and hides the cutout + attribution when subject is null", () => {
    render(
      <QaPairKey
        question="Zonder subject"
        answer={answer("Valt terug op de tekstkolom.")}
        subject={null}
      />,
    );

    // Caption still shows — but above the answer column, not above an empty
    // photo slot.
    expect(screen.getByText("Zonder subject")).toBeInTheDocument();
    expect(screen.queryByTestId("subject-photo")).toBeNull();
    expect(screen.queryByTestId("subject-attribution-key")).toBeNull();
  });
});
