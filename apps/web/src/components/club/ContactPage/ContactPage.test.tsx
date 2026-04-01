import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactPage } from "./ContactPage";
import type { KeyContactVM } from "@/lib/repositories/staff.repository";

// Stub MapEmbed to avoid consent/iframe complexity in unit tests
vi.mock("./MapEmbed", () => ({
  MapEmbed: () => <div data-testid="map-embed" />,
}));

const KEY_CONTACTS: KeyContactVM[] = [
  { role: "Voorzitter", name: "Jan Janssens", email: "jan@kcvv.be" },
  { role: "Secretaris", name: "Piet Pieters", email: "piet@kcvv.be" },
];

describe("ContactPage — Snelle contacten section", () => {
  it("renders the section heading when key contacts are provided", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(
      screen.getByRole("heading", { name: /snelle contacten/i }),
    ).toBeInTheDocument();
  });

  it("renders each key contact with role, name, and mailto link", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    const mailtoLink = screen.getByRole("link", { name: /jan@kcvv.be/i });
    expect(mailtoLink).toHaveAttribute("href", "mailto:jan@kcvv.be");
  });

  it("does not render section when keyContacts is empty", () => {
    render(<ContactPage keyContacts={[]} />);
    expect(
      screen.queryByRole("heading", { name: /snelle contacten/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render section when keyContacts is undefined", () => {
    render(<ContactPage />);
    expect(
      screen.queryByRole("heading", { name: /snelle contacten/i }),
    ).not.toBeInTheDocument();
  });
});

describe("ContactPage — Kom naar ons section", () => {
  it("renders the section heading", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { name: /kom naar ons/i }),
    ).toBeInTheDocument();
  });

  it("shows parking information", () => {
    render(<ContactPage />);
    expect(screen.getByText(/parkeren/i)).toBeInTheDocument();
    expect(screen.getByText(/Van Innis sportpark/i)).toBeInTheDocument();
  });

  it("shows entry prices table with all tiers", () => {
    render(<ContactPage />);
    expect(screen.getByText("Jeugd")).toBeInTheDocument();
    expect(screen.getByText("€3")).toBeInTheDocument();
    expect(screen.getByText("B-ploeg")).toBeInTheDocument();
    expect(screen.getByText("€5")).toBeInTheDocument();
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
    expect(screen.getByText("€10")).toBeInTheDocument();
  });

  it("shows canteen training-day hours", () => {
    render(<ContactPage />);
    expect(screen.getByText(/woensdag/i)).toBeInTheDocument();
    expect(screen.getByText(/vrijdag/i)).toBeInTheDocument();
    expect(screen.getByText(/18u00/i)).toBeInTheDocument();
    expect(screen.getByText(/donderdag/i)).toBeInTheDocument();
    expect(screen.getByText(/20u00/i)).toBeInTheDocument();
  });

  it("shows accessibility note", () => {
    render(<ContactPage />);
    expect(screen.getByText(/rolstoelgebruikers/i)).toBeInTheDocument();
    expect(
      screen.getByText(/2 voorbehouden parkeerplaatsen/i),
    ).toBeInTheDocument();
  });
});
