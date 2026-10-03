/**
 * The two photo pairs that grow from a list into a detail page (#3405,
 * decided in #3400): a news card's cover into the article's cover, a squad
 * card's photo into the player's. Each source names ONLY its photo, and only
 * once tapped; each detail end carries the record's name. The fixture-row pair
 * lives in `MatchHero.travel.test.tsx`.
 */
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NewsCard } from "@/components/article/NewsCard";
import { EditorialHero } from "@/components/article/EditorialHero";
import { EditorialHubCard } from "@/components/editorial/EditorialHubCard/EditorialHubCard";
import { PlayerCard } from "@/components/team/SquadGrid/PlayerCard";
import { PlayerHero } from "@/components/player/PlayerHero";

const pathnameMock = vi.hoisted(() => ({ value: "/nieuws" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathnameMock.value }));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

// The stock `react` build used by Vitest renders `<ViewTransition>` as a bare
// passthrough, so the boundary is invisible in the DOM. Stand it in with a
// marked wrapper to see which element carries it and under which name.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  ViewTransition: ({
    name,
    share,
    children,
  }: {
    name?: string;
    share?: string;
    children: ReactNode;
  }) => (
    <div data-vt={name ?? ""} data-share={share}>
      {children}
    </div>
  ),
}));

/** The names currently on the page, in document order. */
const named = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-vt]")]
    .map((el) => el.getAttribute("data-vt"))
    .filter(Boolean);

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, media: "" }),
  );
});
afterEach(() => {
  // Spend the module-level tap: the next test starts on a committed page.
  pathnameMock.value = "/elders";
  render(<NewsCard title="x" href="/nieuws/x" imageUrl="/x.jpg" />);
  pathnameMock.value = "/nieuws";
  vi.unstubAllGlobals();
});

describe("news card → article", () => {
  const card = (props = {}) => (
    <NewsCard
      title="Winst in Mechelen"
      href="/nieuws/winst"
      imageUrl="/cover.jpg"
      {...props}
    />
  );

  it("names the cover, not the card, once tapped", () => {
    const { container } = render(card());
    expect(named(container)).toEqual([]);
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual(["article-travel-winst"]);
    const boundary = container.querySelector("[data-vt]");
    expect(boundary).toContainElement(
      screen.getByTestId("newscard-image-region"),
    );
    expect(boundary).not.toContainElement(screen.getByRole("link"));
    expect(boundary).toHaveAttribute("data-share", "travel");
  });

  it.each([
    ["a gallery", { href: "/galerij/finale" }],
    ["a player", { href: "/spelers/123" }],
    ["the listing", { href: "/nieuws" }],
    ["a card without a photo", { imageUrl: undefined }],
  ])("keeps the cut for %s", (_label, props) => {
    const { container } = render(card(props));
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual([]);
  });

  it("keeps a card without a link inert", () => {
    const { container } = render(card({ href: undefined }));
    expect(named(container)).toEqual([]);
  });
});

describe("hub card → article", () => {
  const hub = (props = {}) => (
    <EditorialHubCard
      variant="news"
      href="/nieuws/winst"
      tag="Jeugd"
      title="Winst"
      arrowText="Lees verder"
      imageUrl="/cover.jpg"
      {...props}
    />
  );

  it("names the cover once tapped", () => {
    const { container } = render(hub());
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual(["article-travel-winst"]);
  });

  it.each([
    ["a nav tile", { variant: "nav" }],
    ["a section page", { href: "/club/geschiedenis" }],
    ["a card without a photo", { imageUrl: undefined }],
  ])("keeps the cut for %s", (_label, props) => {
    const { container } = render(hub(props));
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual([]);
  });
});

describe("homepage lead → article", () => {
  it("names the cover once the hero link is tapped, and the detail cover always", () => {
    const home = render(
      <EditorialHero
        variant="announcement"
        placement="homepage"
        slug="winst"
        title="Winst"
        coverImage={{ url: "/cover.jpg" }}
      />,
    );
    expect(named(home.container)).toEqual([]);
    fireEvent.click(screen.getByTestId("homepage-hero-link"));
    expect(named(home.container)).toEqual(["article-travel-winst"]);
    home.unmount();

    pathnameMock.value = "/nieuws/winst";
    const detail = render(
      <EditorialHero
        variant="announcement"
        placement="detail"
        slug="winst"
        title="Winst"
        coverImage={{ url: "/cover.jpg" }}
      />,
    );
    expect(named(detail.container)).toEqual(["article-travel-winst"]);
    expect(detail.container.querySelector("[data-vt] figure")).not.toBeNull();
    expect(detail.container.querySelector("[data-vt] h1")).toBeNull();
  });

  it("takes no part without a slug or a cover", () => {
    const { container } = render(
      <EditorialHero
        variant="announcement"
        title="Winst"
        coverImage={{ url: "/cover.jpg" }}
      />,
    );
    expect(named(container)).toEqual([]);
    const noCover = render(
      <EditorialHero variant="announcement" slug="winst" title="Winst" />,
    );
    expect(named(noCover.container)).toEqual([]);
  });
});

describe("squad card → player profile", () => {
  const player = (props = {}) => (
    <PlayerCard
      id="a1"
      firstName="Jan"
      lastName="Peeters"
      href="/spelers/jan-1"
      photoUrl="/jan.jpg"
      {...props}
    />
  );

  it("names the photo figure once tapped", () => {
    const { container } = render(player());
    expect(named(container)).toEqual([]);
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual(["player-travel-jan-1"]);
    expect(container.querySelector("[data-vt]")).toContainElement(
      screen.getByTestId("player-card-figure"),
    );
  });

  it("names the jersey figure when there is no photo", () => {
    const { container } = render(player({ photoUrl: undefined }));
    fireEvent.click(screen.getByRole("link"));
    expect(named(container)).toEqual(["player-travel-jan-1"]);
    expect(container.querySelector("[data-vt]")).toContainElement(
      screen.getByTestId("player-card-illustration"),
    );
  });

  it.each([
    ["a staff card", { href: "/staf/jan-1", garment: "coat" }],
    ["a card without a link", { href: undefined }],
  ])("keeps the cut for %s", (_label, props) => {
    const { container } = render(player(props));
    const link = screen.queryByRole("link");
    if (link) fireEvent.click(link);
    expect(named(container)).toEqual([]);
  });
});

describe("player profile", () => {
  it("carries the player's name on its figure — photo or jersey — always", () => {
    const withPhoto = render(
      <PlayerHero
        id="a1"
        firstName="Jan"
        lastName="Peeters"
        photoUrl="/jan.jpg"
        slug="jan-1"
      />,
    );
    expect(named(withPhoto.container)).toEqual(["player-travel-jan-1"]);
    expect(withPhoto.container.querySelector("[data-vt]")).toContainElement(
      screen.getByTestId("player-hero-figure").querySelector("figure"),
    );
    withPhoto.unmount();

    const jersey = render(
      <PlayerHero id="a1" firstName="Jan" lastName="Peeters" slug="jan-1" />,
    );
    expect(named(jersey.container)).toEqual(["player-travel-jan-1"]);
    expect(jersey.container.querySelector("[data-vt]")).toContainElement(
      screen.getByTestId("player-hero-illustration"),
    );
  });

  it("takes no part without a slug", () => {
    const { container } = render(
      <PlayerHero id="a1" firstName="Jan" lastName="Peeters" />,
    );
    expect(named(container)).toEqual([]);
  });
});
