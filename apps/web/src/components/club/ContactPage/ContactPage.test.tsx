import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactPage } from "./ContactPage";
import type { KeyContactVM } from "@/lib/repositories/staff.repository";

// Stub MapEmbed to avoid consent/iframe complexity in unit tests
vi.mock("./MapEmbed", () => ({
  MapEmbed: () => <div data-testid="map-embed" />,
}));

const KEY_CONTACTS: KeyContactVM[] = [
  { role: "Voorzitter", name: "Jan Janssens", email: "jan@kcvvelewijt.be" },
  { role: "Secretaris", name: "Piet Pieters", email: "piet@kcvvelewijt.be" },
  // Covers jeugd@ — should dedupe the static "Jeugdwerking" category.
  {
    role: "Jeugdcoördinator",
    name: "Marie Maes",
    email: "jeugd@kcvvelewijt.be",
  },
];

describe("ContactPage — hero", () => {
  it("renders the PageHero with the 'Contact' headline and no kicker", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /contact/i }),
    ).toBeInTheDocument();
    // No kicker: the up-link above already names the parent (#2442 rule 6).
    expect(screen.queryByTestId("page-hero-kicker")).not.toBeInTheDocument();
  });

  it("renders the up-link to /club above the hero", () => {
    render(<ContactPage />);
    const upLink = screen.getByTestId("up-link");
    expect(upLink).toHaveAttribute("href", "/club");
    expect(upLink).toHaveTextContent("De club");
  });
});

describe("ContactPage — Clubgegevens", () => {
  it("renders the corrected Driesstraat 32 address", () => {
    render(<ContactPage />);
    expect(screen.getByText(/Driesstraat 32/)).toBeInTheDocument();
    expect(screen.getByText(/1982 Elewijt/)).toBeInTheDocument();
  });

  it("does not render the legacy 'Driesstraat 30' address", () => {
    render(<ContactPage />);
    expect(screen.queryByText(/Driesstraat 30/)).not.toBeInTheDocument();
  });

  it("links the route description to the Driesstraat 32 map deep-link", () => {
    render(<ContactPage />);
    const route = screen.getByRole("link", { name: /routebeschrijving/i });
    expect(route).toHaveAttribute(
      "href",
      expect.stringContaining("Driesstraat+32"),
    );
  });

  // #2474 rule 4 — an action link (mailto:, Google Maps) is lowercase body
  // type, so the highlighter marker binds. The mailto link keeps its
  // Envelope icon as-is; only the affordance chrome (`hover:underline`) is
  // replaced by the marker.
  it("gives the Maps and mailto action links the .prose-link marker", () => {
    render(<ContactPage />);
    const route = screen.getByRole("link", { name: /routebeschrijving/i });
    expect(route).toHaveClass("prose-link");
    const [infoLink] = screen.getAllByRole("link", {
      name: /info@kcvvelewijt.be/i,
    });
    expect(infoLink).toHaveClass("prose-link");
  });

  // #2547 rule 2 amends #2474 rule 4 — the Maps link hands the visitor to a
  // third party (Google Maps), so it earns the external mark instead of the
  // bare Phosphor ArrowRight it used to carry. The mailto links stay outside
  // this ticket's population (#2547 — "the mailto:/tel: family").
  it("marks the Routebeschrijving link external, replacing its bare ArrowRight", () => {
    render(<ContactPage />);
    const route = screen.getByRole("link", { name: /routebeschrijving/i });
    expect(route.textContent).toContain("(opent in een nieuw tabblad)");
    expect(route.querySelector('svg[aria-hidden="true"]')).toBeTruthy();

    const [infoLink] = screen.getAllByRole("link", {
      name: /info@kcvvelewijt.be/i,
    });
    expect(infoLink.textContent).not.toContain("opent in een nieuw tabblad");
  });

  it("renders the general info mailto and both cross-links", () => {
    render(<ContactPage />);
    // info@ appears here AND as the "Algemene vragen" category card (the
    // locked mockup keeps both — only the key-contact↔category overlap is
    // deduped, not the headline club email), so assert at least one.
    const infoLinks = screen.getAllByRole("link", {
      name: /info@kcvvelewijt.be/i,
    });
    expect(infoLinks.length).toBeGreaterThanOrEqual(1);
    expect(infoLinks[0]).toHaveAttribute("href", "mailto:info@kcvvelewijt.be");
    expect(screen.getByRole("link", { name: /hulpvinder/i })).toHaveAttribute(
      "href",
      "/hulp",
    );
    expect(screen.getByRole("link", { name: /organigram/i })).toHaveAttribute(
      "href",
      "/hulp#structuur",
    );
  });

  it("renders the paper-framed MapEmbed", () => {
    render(<ContactPage />);
    expect(screen.getByTestId("map-embed")).toBeInTheDocument();
  });
});

describe("ContactPage — Contacteer ons (merged grid)", () => {
  it("renders the single merged 'Contacteer ons' heading", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(
      screen.getByRole("heading", { name: /contacteer ons/i }),
    ).toBeInTheDocument();
  });

  it("no longer renders a separate 'Snelle contacten' heading", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(
      screen.queryByRole("heading", { name: /snelle contacten/i }),
    ).not.toBeInTheDocument();
  });

  it("renders each key contact with role, name, and mailto link", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    const mailtoLink = screen.getByRole("link", {
      name: /jan@kcvvelewijt.be/i,
    });
    expect(mailtoLink).toHaveAttribute("href", "mailto:jan@kcvvelewijt.be");
  });

  it("dedupes a static category whose email is already covered by a key contact", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    // The Jeugdcoördinator key contact covers jeugd@ → the static
    // "Jeugdwerking" category must not render a duplicate.
    expect(screen.queryByText("Jeugdwerking")).not.toBeInTheDocument();
    const jeugdLinks = screen
      .getAllByRole("link")
      .filter(
        (el) => el.getAttribute("href") === "mailto:jeugd@kcvvelewijt.be",
      );
    expect(jeugdLinks).toHaveLength(1);
  });

  it("still renders the non-overlapping static categories", () => {
    render(<ContactPage keyContacts={KEY_CONTACTS} />);
    expect(
      screen.getByRole("link", { name: /sponsoring@kcvvelewijt.be/i }),
    ).toHaveAttribute("href", "mailto:sponsoring@kcvvelewijt.be");
    expect(
      screen.getByRole("link", { name: /kevin@kcvvelewijt.be/i }),
    ).toHaveAttribute("href", "mailto:kevin@kcvvelewijt.be");
  });

  it("renders the static categories even when no key contacts are provided", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { name: /contacteer ons/i }),
    ).toBeInTheDocument();
    // With no key contact covering jeugd@, the Jeugdwerking category shows.
    expect(
      screen.getByRole("link", { name: /jeugd@kcvvelewijt.be/i }),
    ).toBeInTheDocument();
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

  it("states the bestuur's parking facts and promises no Zemst parking plan", () => {
    render(<ContactPage />);
    expect(
      screen.getByText(
        /hondenschool, het jeugdhuis, de curling en de judozaal/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /niet op gele lijnen, op private plaatsen of in opritten/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/parkeerplan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/gemeente Zemst/i)).not.toBeInTheDocument();
  });

  it("prints the payment line inside the Kantine card, without Payconiq", () => {
    render(<ContactPage />);
    const kantineCard =
      screen.getByText("Kantine").parentElement!.parentElement!;
    expect(
      within(kantineCard).getByText(
        "Betalen kan met kaart (geen Mastercard of kredietkaarten), met de KNIP-app of cash.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/payconiq/i)).not.toBeInTheDocument();
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

  it("shows the canteen hours and no invented match-day hours", () => {
    render(<ContactPage />);
    expect(
      screen.getByText("Woensdag & vrijdag: 17u45 – 21u00"),
    ).toBeInTheDocument();
    expect(screen.getByText("Donderdag: 20u00 – 22u00")).toBeInTheDocument();
    expect(
      screen.getByText("Op thuiswedstrijddagen open, zonder vaste uren."),
    ).toBeInTheDocument();
  });

  it("shows accessibility note", () => {
    render(<ContactPage />);
    expect(screen.getByText(/rolstoelgebruikers/i)).toBeInTheDocument();
    expect(
      screen.getByText(/2 voorbehouden parkeerplaatsen/i),
    ).toBeInTheDocument();
  });
});
