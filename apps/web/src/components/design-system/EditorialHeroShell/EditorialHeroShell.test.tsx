import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialHeroShell } from "./EditorialHeroShell";

describe("EditorialHeroShell", () => {
  it("renders the editorial column", () => {
    render(<EditorialHeroShell editorial={<p>editorial</p>} />);
    expect(screen.getByText("editorial")).toBeInTheDocument();
  });

  it("renders the cover column when supplied", () => {
    render(
      <EditorialHeroShell editorial={<p>editorial</p>} cover={<p>cover</p>} />,
    );
    expect(screen.getByText("cover")).toBeInTheDocument();
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["false", false],
  ])(
    "omits the cover wrapper when cover is %s (any non-renderable ReactNode)",
    (_label, cover) => {
      const { container } = render(
        <EditorialHeroShell editorial={<p>editorial</p>} cover={cover} />,
      );
      expect(container.querySelectorAll("section > div")).toHaveLength(1);
    },
  );
});
