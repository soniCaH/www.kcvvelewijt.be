import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectAvatarCluster } from "./SubjectAvatarCluster";

const members = [
  { firstName: "Julien", fullName: "Julien V" },
  { firstName: "Niels", fullName: "Niels P" },
];

describe("<SubjectAvatarCluster>", () => {
  it("renders one monogram disc per member", () => {
    const { container } = render(<SubjectAvatarCluster members={members} />);
    const discs = container.querySelectorAll(
      '[data-subject-avatar="monogram"]',
    );
    expect(discs).toHaveLength(2);
    expect(container.textContent).toBe("JN");
  });

  it("renders monograms (never photos) at attribution scale", () => {
    const { container } = render(
      <SubjectAvatarCluster members={members} scale="attribution" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(
      container.querySelectorAll('[data-subject-avatar="monogram"]'),
    ).toHaveLength(2);
  });

  it("collapses the tail into a +N counter past the cap", () => {
    const four = [
      ...members,
      { firstName: "Lars", fullName: "Lars J" },
      { firstName: "Tom", fullName: "Tom D" },
    ];
    const { container } = render(
      <SubjectAvatarCluster members={four} max={3} />,
    );
    expect(
      container.querySelectorAll('[data-subject-avatar="monogram"]'),
    ).toHaveLength(3);
    const overflow = container.querySelector(
      '[data-subject-avatar-cluster="overflow"]',
    );
    expect(overflow?.textContent).toBe("+1");
    expect(
      container.querySelector("[data-count]")?.getAttribute("data-count"),
    ).toBe("4");
  });

  it("renders nothing for an empty member list", () => {
    const { container } = render(<SubjectAvatarCluster members={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("announces the cluster once via a group label, with the discs hidden from AT", () => {
    const { container } = render(<SubjectAvatarCluster members={members} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("role")).toBe("img");
    expect(root.getAttribute("aria-label")).toBe("Julien V, Niels P");
    // The individual discs live under an aria-hidden wrapper.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("includes the overflow count in the group label", () => {
    const four = [
      ...members,
      { firstName: "Lars", fullName: "Lars J" },
      { firstName: "Tom", fullName: "Tom D" },
    ];
    const { container } = render(
      <SubjectAvatarCluster members={four} max={3} />,
    );
    expect(
      (container.firstElementChild as HTMLElement).getAttribute("aria-label"),
    ).toBe("Julien V, Niels P, Lars J +1");
  });
});
