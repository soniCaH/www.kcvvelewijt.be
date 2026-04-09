import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialLinks } from "./SocialLinks";

describe("SocialLinks", () => {
  it("renders all three social links", () => {
    render(<SocialLinks />);
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
  });

  it("renders circle variant by default", () => {
    render(<SocialLinks />);
    const link = screen.getByLabelText("Facebook");
    expect(link).toHaveClass("rounded-full", "border-2");
  });

  it("renders inline variant", () => {
    render(<SocialLinks variant="inline" />);
    const link = screen.getByLabelText("Facebook");
    expect(link).not.toHaveClass("border-2");
  });

  it("inline variant has ≥44×44 tap area on each social link", () => {
    render(<SocialLinks variant="inline" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
      expect(link).toHaveClass("min-h-11", "min-w-11");
    }
  });

  it("opens links in new tab", () => {
    render(<SocialLinks />);
    const link = screen.getByLabelText("Facebook");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies custom className", () => {
    const { container } = render(<SocialLinks className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders horizontal direction by default", () => {
    const { container } = render(<SocialLinks />);
    const list = container.querySelector("ul");
    expect(list).toHaveClass("flex-row");
  });

  it("renders vertical direction", () => {
    const { container } = render(<SocialLinks direction="vertical" />);
    const list = container.querySelector("ul");
    expect(list).toHaveClass("flex-col");
  });

  it("has correct Facebook URL", () => {
    render(<SocialLinks />);
    expect(screen.getByLabelText("Facebook")).toHaveAttribute(
      "href",
      "https://facebook.com/KCVVElewijt/",
    );
  });

  it("has correct Twitter URL", () => {
    render(<SocialLinks />);
    expect(screen.getByLabelText("Twitter")).toHaveAttribute(
      "href",
      "https://twitter.com/kcvve",
    );
  });

  it("has correct Instagram URL", () => {
    render(<SocialLinks />);
    expect(screen.getByLabelText("Instagram")).toHaveAttribute(
      "href",
      "https://www.instagram.com/kcvve",
    );
  });
});
