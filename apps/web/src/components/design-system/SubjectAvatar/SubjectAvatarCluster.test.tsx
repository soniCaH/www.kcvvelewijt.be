import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectAvatarCluster } from "./SubjectAvatarCluster";

const members = [{ firstName: "Julien" }, { firstName: "Niels" }];

describe("<SubjectAvatarCluster>", () => {
  it("renders one monogram disc per member", () => {
    const { container } = render(<SubjectAvatarCluster members={members} />);
    const discs = container.querySelectorAll('[data-round-avatar="monogram"]');
    expect(discs).toHaveLength(2);
    expect(container.textContent).toBe("JN");
  });

  it("renders monograms (never photos) at attribution scale", () => {
    const { container } = render(
      <SubjectAvatarCluster members={members} scale="attribution" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(
      container.querySelectorAll('[data-round-avatar="monogram"]'),
    ).toHaveLength(2);
  });

  it("collapses the tail into a +N counter past the cap", () => {
    const four = [...members, { firstName: "Lars" }, { firstName: "Tom" }];
    const { container } = render(
      <SubjectAvatarCluster members={four} max={3} />,
    );
    expect(
      container.querySelectorAll('[data-round-avatar="monogram"]'),
    ).toHaveLength(3);
    const overflow = container.querySelector('[data-round-avatar="glyph"]');
    expect(overflow?.textContent).toBe("+1");
    // Not a person, but it takes the size of the avatar beside it, and the ring.
    expect(overflow?.getAttribute("data-size")).toBe("40");
    expect((overflow as HTMLElement).className).toContain("border-2");
    expect(
      container.querySelector("[data-count]")?.getAttribute("data-count"),
    ).toBe("4");
  });

  it("keeps one letter per member, compound first names included", () => {
    const { container } = render(
      <SubjectAvatarCluster
        members={[{ firstName: "Jan Willem" }, { firstName: "Niels" }]}
      />,
    );
    expect(container.textContent).toBe("JN");
  });

  it("renders nothing for an empty member list", () => {
    const { container } = render(<SubjectAvatarCluster members={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("says nothing at all — QARow renders the joined names beside it", () => {
    // #2559 rule 4: monograms are not likenesses. The cluster used to announce
    // a group label, duplicating the visible speaker tag next to it.
    const { container } = render(<SubjectAvatarCluster members={members} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.getAttribute("role")).toBeNull();
    expect(root.getAttribute("aria-label")).toBeNull();
  });

  it("still collapses the tail into a +N counter", () => {
    const four = [...members, { firstName: "Lars" }, { firstName: "Tom" }];
    const { container } = render(
      <SubjectAvatarCluster members={four} max={3} />,
    );
    expect(
      container.querySelector('[data-round-avatar="glyph"]')?.textContent,
    ).toBe("+1");
  });
});
