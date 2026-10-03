import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TravelLink, TravelScope, TravelTarget } from "./Travel";

const pathnameMock = vi.hoisted(() => ({ value: "/nieuws" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathnameMock.value }));

const linkProps = vi.hoisted(() => vi.fn());
// Stands in for `next/link`: like Next's, it reads `transitionTypes` as the
// click navigates (after the consumer's `onClick`), and keeps the click from
// navigating.
vi.mock("next/link", () => ({
  default: ({
    transitionTypes,
    onClick,
    ...props
  }: ComponentProps<"a"> & { transitionTypes?: string[] }) => (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        linkProps({ transitionTypes: [...(transitionTypes ?? [])] });
      }}
    />
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
    default: all,
    children,
  }: {
    name?: string;
    share?: string;
    default?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="boundary"
      data-view-transition={name}
      data-share={share}
      data-default={all}
    >
      {children}
    </div>
  ),
}));

function reducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
    })),
  );
}

const names = () =>
  screen
    .getAllByTestId("boundary")
    .map((el) => el.getAttribute("data-view-transition"));

/** A news card: the link is an overlay NEXT to the photo that travels. */
function Card({ slug, label }: { slug: string; label: string }) {
  return (
    <TravelScope kind="article" href={`/nieuws/${slug}`}>
      <TravelTarget>
        <div>photo {label}</div>
      </TravelTarget>
      <TravelLink aria-label={label} />
    </TravelScope>
  );
}

describe("travel source", () => {
  beforeEach(() => {
    linkProps.mockClear();
    reducedMotion(false);
  });
  afterEach(() => {
    // Spend the module-level tap: the next test starts on a committed page.
    pathnameMock.value = "/elders";
    render(<Card slug="x" label="x" />).rerender(<Card slug="x" label="x" />);
    pathnameMock.value = "/nieuws";
    vi.unstubAllGlobals();
  });

  it("names no photo at render", () => {
    render(<Card slug="winst" label="winst" />);
    expect(names()).toEqual([null]);
  });

  it("names the photo, not the link, once its link is tapped", () => {
    render(<Card slug="winst" label="winst" />);
    fireEvent.click(screen.getByRole("link", { name: "winst" }));
    const [boundary] = screen.getAllByTestId("boundary");
    expect(boundary).toHaveAttribute(
      "data-view-transition",
      "article-travel-winst",
    );
    // Opts in on `share` only: a plain leave starts no transition.
    expect(boundary).toHaveAttribute("data-default", "none");
    expect(boundary).toHaveAttribute("data-share", "travel");
    expect(boundary).toHaveTextContent("photo winst");
    expect(screen.getByRole("link", { name: "winst" })).not.toHaveAttribute(
      "style",
    );
  });

  it("names only the tapped card, even when two show the same article", () => {
    render(
      <>
        <Card slug="winst" label="grid" />
        <Card slug="winst" label="related" />
      </>,
    );
    fireEvent.click(screen.getByRole("link", { name: "related" }));
    expect(names()).toEqual([null, "article-travel-winst"]);
  });

  it("names no photo on the article's own page", () => {
    pathnameMock.value = "/nieuws/winst";
    render(<Card slug="winst" label="winst" />);
    fireEvent.click(screen.getByRole("link", { name: "winst" }));
    expect(names()).toEqual([null]);
  });

  it("names no photo under prefers-reduced-motion", () => {
    reducedMotion(true);
    render(<Card slug="winst" label="winst" />);
    fireEvent.click(screen.getByRole("link", { name: "winst" }));
    expect(names()).toEqual([null]);
  });

  it("names nothing when the href is not the kind's detail page", () => {
    render(
      <TravelScope kind="article" href="/spelers/jan">
        <TravelTarget>
          <div>photo</div>
        </TravelTarget>
        <TravelLink aria-label="jan" />
      </TravelScope>,
    );
    fireEvent.click(screen.getByRole("link", { name: "jan" }));
    expect(names()).toEqual([null]);
  });

  it("a target outside any scope is plain", () => {
    render(
      <TravelTarget>
        <div>photo</div>
      </TravelTarget>,
    );
    expect(names()).toEqual([null]);
  });
});

describe("TravelLink", () => {
  beforeEach(() => {
    linkProps.mockClear();
    reducedMotion(false);
  });
  afterEach(() => {
    pathnameMock.value = "/elders";
    render(<Card slug="x" label="x" />).rerender(<Card slug="x" label="x" />);
    pathnameMock.value = "/nieuws";
    vi.unstubAllGlobals();
  });

  it("links to the href its scope was given", () => {
    render(<Card slug="winst" label="winst" />);
    expect(screen.getByRole("link", { name: "winst" })).toHaveAttribute(
      "href",
      "/nieuws/winst",
    );
  });

  it("needs a scope", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TravelLink aria-label="a" />)).toThrow(/TravelScope/);
    vi.restoreAllMocks();
  });

  describe("transition types, read by Next when the click happens", () => {
    const typesAtClick = () => linkProps.mock.lastCall?.[0].transitionTypes;
    const renderCard = (transitionTypes?: string[], travels = true) =>
      render(
        <TravelScope
          kind={travels ? "article" : undefined}
          href="/nieuws/winst"
        >
          <TravelLink aria-label="winst" transitionTypes={transitionTypes} />
        </TravelScope>,
      );
    const click = (init?: object) =>
      fireEvent.click(screen.getByRole("link", { name: "winst" }), init);

    it("adds `travel` when the click recorded a tap", () => {
      renderCard();
      click();
      expect(typesAtClick()).toEqual(["travel"]);
    });

    it("keeps the consumer's own types and adds `travel` after them", () => {
      renderCard(["other"]);
      click();
      expect(typesAtClick()).toEqual(["other", "travel"]);
    });

    it("adds no `travel` when no tap was recorded, but keeps the consumer's", () => {
      renderCard(["other"]);
      click({ metaKey: true });
      expect(typesAtClick()).toEqual(["other"]);
    });

    it("adds no `travel` under reduced motion", () => {
      reducedMotion(true);
      renderCard();
      click();
      expect(typesAtClick()).toEqual([]);
    });

    it("adds no `travel` for a scope that never travels", () => {
      renderCard(undefined, false);
      click();
      expect(typesAtClick()).toEqual([]);
    });

    it("starts clean on the next click", () => {
      renderCard();
      click();
      click({ shiftKey: true });
      expect(typesAtClick()).toEqual([]);
    });
  });

  it("still calls the consumer's own onClick", () => {
    const onClick = vi.fn();
    render(
      <TravelScope kind="article" href="/nieuws/a">
        <TravelLink onClick={onClick} aria-label="a" />
      </TravelScope>,
    );
    fireEvent.click(screen.getByRole("link", { name: "a" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe("records a tap only for a click that navigates", () => {
    const row = () => screen.getByRole("link", { name: "winst" });
    const renderCard = (onClick?: (e: React.MouseEvent) => void) =>
      render(
        <TravelScope kind="article" href="/nieuws/winst">
          <TravelTarget>
            <div>photo</div>
          </TravelTarget>
          <TravelLink aria-label="winst" onClick={onClick} />
        </TravelScope>,
      );
    const tapped = () => names()[0] !== null;

    it("a plain primary click", () => {
      renderCard();
      fireEvent.click(row());
      expect(tapped()).toBe(true);
    });

    it.each([["metaKey"], ["ctrlKey"], ["shiftKey"], ["altKey"]])(
      "not a %s click",
      (modifier) => {
        renderCard();
        fireEvent.click(row(), { [modifier]: true });
        expect(tapped()).toBe(false);
      },
    );

    it("not a non-primary button", () => {
      renderCard();
      fireEvent.click(row(), { button: 1 });
      expect(tapped()).toBe(false);
    });

    it("not a click the consumer's onClick cancelled", () => {
      renderCard((event) => event.preventDefault());
      fireEvent.click(row());
      expect(tapped()).toBe(false);
    });
  });
});
