import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageFooter } from "./PageFooter";
import { EXTERNAL_LINKS } from "@/lib/constants";

vi.mock("./CookiePreferencesButton", () => ({
  CookiePreferencesButton: () => (
    <button type="button">Cookie-instellingen</button>
  ),
}));

describe("PageFooter", () => {
  it("renders a footer element", () => {
    const { container } = render(<PageFooter />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders green hero zone with KCVV Elewijt display text", () => {
    render(<PageFooter />);
    const heroText = screen.getByText("KCVV Elewijt");
    expect(heroText).toBeInTheDocument();
    expect(heroText.className).toMatch(/font-title/);
  });

  it("renders two SectionTransitions: one into the green hero zone and one between green hero and black info zone", () => {
    // The second transition (green → black) was added so the previously
    // hard color seam between the green KCVV hero zone and the black info
    // zone is now a smooth diagonal cut, matching the rest of the site.
    render(<PageFooter />);
    const transitions = screen.queryAllByTestId("section-transition");
    expect(transitions).toHaveLength(2);
  });

  it("renders club crest logo", () => {
    render(<PageFooter />);
    const logo = screen.getByAltText("KCVV Elewijt");
    expect(logo).toBeInTheDocument();
  });

  it("renders Club heading with correct links", () => {
    render(<PageFooter />);
    expect(screen.getByText("Club")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nieuws" })).toHaveAttribute(
      "href",
      "/nieuws",
    );
    expect(screen.getByRole("link", { name: "Kalender" })).toHaveAttribute(
      "href",
      "/kalender",
    );
    expect(screen.getByRole("link", { name: "Ploegen" })).toHaveAttribute(
      "href",
      "/ploegen",
    );
    expect(screen.getByRole("link", { name: "Sponsors" })).toHaveAttribute(
      "href",
      "/sponsors",
    );
    expect(screen.getByRole("link", { name: "Bestuur" })).toHaveAttribute(
      "href",
      "/club/organigram",
    );
  });

  it("renders Contact heading with address and email", () => {
    render(<PageFooter />);
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText(/Driesstraat 32/)).toBeInTheDocument();
    expect(screen.getByText(/1982 Elewijt/)).toBeInTheDocument();
    const emailLink = screen.getByRole("link", {
      name: /info@kcvvelewijt\.be/i,
    });
    expect(emailLink).toHaveAttribute("href", "mailto:info@kcvvelewijt.be");
  });

  it("renders social icons in contact section", () => {
    render(<PageFooter />);
    const fbLink = screen.getByRole("link", { name: /facebook/i });
    expect(fbLink).toHaveAttribute("href", "https://facebook.com/KCVVElewijt/");
    const igLink = screen.getByRole("link", { name: /instagram/i });
    expect(igLink).toHaveAttribute("href", "https://www.instagram.com/kcvve");
  });

  it("renders copyright without dots in abbreviation", () => {
    render(<PageFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} KCVV Elewijt`)).toBeInTheDocument();
  });

  it("renders privacy link in bottom bar", () => {
    render(<PageFooter />);
    const privacyLink = screen.getByRole("link", { name: "Privacyverklaring" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("renders cookie preferences button in bottom bar", () => {
    render(<PageFooter />);
    const btn = screen.getByRole("button", { name: /cookie-instellingen/i });
    expect(btn).toBeInTheDocument();
  });

  it("renders Webshop link as external link opening in new tab", () => {
    render(<PageFooter />);
    const webshopLink = screen.getByRole("link", { name: "Webshop" });
    expect(webshopLink).toHaveAttribute("href", EXTERNAL_LINKS.webshop);
    expect(webshopLink).toHaveAttribute("target", "_blank");
    expect(webshopLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies custom className", () => {
    const { container } = render(<PageFooter className="custom-footer" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("custom-footer");
  });
});
