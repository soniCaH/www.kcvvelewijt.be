/**
 * ResponsibilityBlock Component Tests
 *
 * Tests for the homepage teaser variant. The legacy role-dropdown +
 * inline-sentence finder has been replaced with the new HulpSearchInput
 * which submits to /hulp.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsibilityBlock } from "./ResponsibilityBlock";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("ResponsibilityBlock", () => {
  it("renders the headline and tagline", () => {
    render(<ResponsibilityBlock />);
    expect(
      screen.getByRole("heading", { name: /hoe kunnen we je helpen/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/vind snel de juiste contactpersoon/i),
    ).toBeInTheDocument();
  });

  it("renders the HulpSearchInput inside a search form", () => {
    render(<ResponsibilityBlock />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("navigates to /hulp when the search form is submitted", () => {
    render(<ResponsibilityBlock />);
    const form = screen.getByRole("search");
    fireEvent.submit(form);
    expect(mockPush).toHaveBeenCalledWith("/hulp");
  });

  it("renders the 'Bekijk alle veelgestelde vragen' link to /hulp", () => {
    render(<ResponsibilityBlock />);
    const link = screen.getByRole("link", {
      name: /bekijk alle veelgestelde vragen/i,
    });
    expect(link).toHaveAttribute("href", "/hulp");
  });

  it("renders the three quick-link cards with their hrefs", () => {
    render(<ResponsibilityBlock />);
    expect(screen.getByRole("link", { name: /organigram/i })).toHaveAttribute(
      "href",
      "/club/organigram",
    );
    expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute(
      "href",
      "/club/contact",
    );
    expect(screen.getByRole("link", { name: /inschrijven/i })).toHaveAttribute(
      "href",
      "/club/inschrijven",
    );
  });

  it("renders the supporting copy on the quick-link cards", () => {
    render(<ResponsibilityBlock />);
    expect(screen.getByText(/alle bestuursleden/i)).toBeInTheDocument();
    expect(screen.getByText(/algemene info/i)).toBeInTheDocument();
    expect(screen.getByText(/word lid/i)).toBeInTheDocument();
  });

  it("uses an h2 for the main heading", () => {
    render(<ResponsibilityBlock />);
    const heading = screen.getByText(/hoe kunnen we je helpen/i);
    expect(heading.tagName).toBe("H2");
  });
});
