import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrganigramHero } from "./OrganigramHero";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
} from "../HubSearch/hub-search.fixture";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

function renderHero() {
  return render(
    <OrganigramHero
      members={HUB_SEARCH_MEMBERS}
      responsibilityPaths={HUB_SEARCH_PATHS}
      structureIndex={{ posities: 23, mensen: 30, afdelingen: 2 }}
    />,
  );
}

describe("OrganigramHero", () => {
  it("renders the heading as an h1 with a trailing period", () => {
    renderHero();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Wie doet wat.");
  });

  it("renders the structure-index counts and labels", () => {
    renderHero();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("posities")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("mensen")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("afdelingen")).toBeInTheDocument();
  });

  it("embeds the hub search", () => {
    renderHero();
    expect(
      screen.getByLabelText("Zoek een persoon of hulpvraag"),
    ).toBeInTheDocument();
  });

  it("renders four audience chips that deep-link into Hulp with the audience pre-filtered", () => {
    renderHero();
    const chips = screen.getAllByRole("link").filter((link) => {
      const href = link.getAttribute("href") ?? "";
      return href.startsWith("/hulp?audience=") && href.endsWith("#hulp");
    });
    expect(chips).toHaveLength(4);
    expect(screen.getByText("Ik ben ouder")).toBeInTheDocument();
  });
});
