import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnnouncementHero } from "./AnnouncementHero";

describe("AnnouncementHero", () => {
  it("renders the title as the single h1", () => {
    render(
      <AnnouncementHero title="Een nieuw hoofdstuk voor het eerste elftal." />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Een nieuw hoofdstuk voor het eerste elftal.",
    );
  });

  it("renders kicker with category and date separated by a pipe", () => {
    render(
      <AnnouncementHero title="Title" category="Nieuws" date="19 April 2026" />,
    );
    const kicker = screen.getByTestId("announcement-hero-kicker");
    const text = (kicker.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(text).toMatch(/Nieuws\s*\|\s*19 April 2026/);
  });

  it("renders kicker with only category when date is absent", () => {
    render(<AnnouncementHero title="Title" category="Nieuws" />);
    const text =
      screen.getByTestId("announcement-hero-kicker").textContent ?? "";
    expect(text).toContain("Nieuws");
    expect(text).not.toContain("|");
  });

  it("omits the kicker entirely when neither category nor date is provided", () => {
    render(<AnnouncementHero title="Title" />);
    expect(screen.queryByTestId("announcement-hero-kicker")).toBeNull();
  });

  it("renders the 16:9 cover image when coverImageUrl is provided", () => {
    render(
      <AnnouncementHero
        title="Title"
        coverImageUrl="https://cdn.sanity.io/cover.webp"
      />,
    );
    expect(screen.getByTestId("announcement-hero-image")).toBeInTheDocument();
  });

  it("omits the image when coverImageUrl is missing", () => {
    render(<AnnouncementHero title="Title" />);
    expect(screen.queryByTestId("announcement-hero-image")).toBeNull();
  });

  it("does not render a byline row — author + reading time live in the §7.6 metadata bar below the hero", () => {
    render(
      <AnnouncementHero title="Title" category="Nieuws" date="19 April 2026" />,
    );
    expect(screen.queryByTestId("announcement-hero-byline")).toBeNull();
  });
});
