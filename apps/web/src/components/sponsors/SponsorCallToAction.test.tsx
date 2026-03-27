/**
 * SponsorCallToAction Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SponsorCallToAction } from "./SponsorCallToAction";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SponsorCallToAction", () => {
  describe("headline", () => {
    it('renders "Word sponsor" as headline', () => {
      render(<SponsorCallToAction />);

      expect(
        screen.getByRole("heading", { name: /word sponsor/i }),
      ).toBeInTheDocument();
    });
  });

  describe("contact actions", () => {
    it("renders primary email button linking to sponsoring@kcvvelewijt.be", () => {
      render(<SponsorCallToAction />);

      const emailLink = screen.getByRole("link", {
        name: /contact opnemen/i,
      });
      expect(emailLink).toHaveAttribute(
        "href",
        "mailto:sponsoring@kcvvelewijt.be",
      );
    });

    it("renders secondary link to /contact", () => {
      render(<SponsorCallToAction />);

      const contactLink = screen.getByRole("link", {
        name: /meer informatie/i,
      });
      expect(contactLink).toHaveAttribute("href", "/contact");
    });
  });

  describe("no benefits grid", () => {
    it("does not render tier benefits content", () => {
      render(<SponsorCallToAction />);

      expect(screen.queryByText(/zichtbaarheid/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/naamsbekendheid/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/lokale betrokkenheid/i),
      ).not.toBeInTheDocument();
    });

    it("does not render emoji icons", () => {
      const { container } = render(<SponsorCallToAction />);

      expect(container.textContent).not.toContain("🎯");
      expect(container.textContent).not.toContain("🤝");
      expect(container.textContent).not.toContain("📈");
    });
  });

  describe("dark styling", () => {
    it("applies dark green background class", () => {
      const { container } = render(<SponsorCallToAction />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("bg-kcvv-green-dark");
    });
  });
});
