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

  it("keeps the editorial column first by default (no order utilities)", () => {
    const { container } = render(
      <EditorialHeroShell editorial={<p>editorial</p>} cover={<p>cover</p>} />,
    );
    const [editorialCol, coverCol] =
      container.querySelectorAll("section > div");
    expect(editorialCol.className).not.toContain("order-2");
    expect(coverCol.className).not.toContain("order-1");
  });

  it("stacks the cover above the editorial on mobile when coverFirstOnMobile", () => {
    const { container } = render(
      <EditorialHeroShell
        editorial={<p>editorial</p>}
        cover={<p>cover</p>}
        coverFirstOnMobile
      />,
    );
    const [editorialCol, coverCol] =
      container.querySelectorAll("section > div");
    // editorial drops below the cover on mobile, restores to the left on lg.
    expect(editorialCol.className).toContain("order-2");
    expect(editorialCol.className).toContain("lg:order-1");
    // cover rises to the top on mobile, restores to the right on lg.
    expect(coverCol.className).toContain("order-1");
    expect(coverCol.className).toContain("lg:order-2");
  });
});
