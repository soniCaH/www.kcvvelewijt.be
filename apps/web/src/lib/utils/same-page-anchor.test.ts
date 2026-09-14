import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { MouseEvent } from "react";
import { handleSamePageAnchorClick, revealHash } from "./same-page-anchor";

/** Minimal stand-in for the fields the handler reads off the click event. */
function clickEvent(
  overrides: Partial<MouseEvent<HTMLAnchorElement>> = {},
): MouseEvent<HTMLAnchorElement> & {
  preventDefault: ReturnType<typeof vi.fn>;
} {
  const preventDefault = vi.fn();
  return {
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault,
    ...overrides,
  } as unknown as MouseEvent<HTMLAnchorElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };
}

function setUrl(url: string) {
  window.history.replaceState(null, "", url);
}

function addSection(id: string): HTMLElement {
  const el = document.createElement("section");
  el.id = id;
  el.scrollIntoView = vi.fn();
  el.focus = vi.fn();
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  setUrl("/hulp");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleSamePageAnchorClick", () => {
  it("intercepts a same-page anchor: scrolls, focuses, keeps a single fragment", () => {
    const el = addSection("structuur");
    setUrl("/hulp#structuur");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/hulp#structuur");

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(el.scrollIntoView).toHaveBeenCalledOnce();
    expect(el.focus).toHaveBeenCalledWith({ preventScroll: true });
    // The bug produced `#structuur#structuur…`; the fragment stays single.
    expect(window.location.hash).toBe("#structuur");
  });

  it("pushes a history entry for an ordinary section change (Back walks sections)", () => {
    addSection("hulp");
    addSection("structuur");
    setUrl("/hulp#hulp");
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/hulp#structuur");

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(pushState).toHaveBeenCalledOnce();
    expect(replaceState).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#structuur");
  });

  it("self-heals an already-duplicated fragment in place (no history entry)", () => {
    addSection("structuur");
    setUrl("/hulp#structuur#structuur");
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/hulp#structuur");

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledOnce();
    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#structuur");
  });

  it("intercepts a same-query anchor", () => {
    const el = addSection("spelers");
    setUrl("/hulp?tab=teams");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/hulp?tab=teams#spelers");

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(el.scrollIntoView).toHaveBeenCalledOnce();
  });

  it("ignores an anchor to a different query string (keeps SPA navigation)", () => {
    addSection("spelers");
    setUrl("/hulp?tab=matches");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/hulp?tab=teams#spelers");

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores a cross-page anchor (keeps SPA navigation)", () => {
    addSection("spelers");
    setUrl("/hulp");
    const event = clickEvent();

    handleSamePageAnchorClick(event, "/ploegen/a-ploeg#spelers");

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores modifier clicks (new tab, etc.)", () => {
    addSection("structuur");
    setUrl("/hulp#structuur");
    const event = clickEvent({ metaKey: true });

    handleSamePageAnchorClick(event, "/hulp#structuur");

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores links without a hash", () => {
    const event = clickEvent();
    handleSamePageAnchorClick(event, "/hulp");
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("does nothing when the target element is absent", () => {
    setUrl("/hulp#structuur");
    const event = clickEvent();
    handleSamePageAnchorClick(event, "/hulp#structuur");
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe("revealHash", () => {
  it("writes the hash when it points somewhere else", () => {
    window.location.hash = "";
    revealHash("blessure");
    expect(window.location.hash).toBe("#blessure");
  });

  it("fires a hashchange itself when the hash already holds that id", () => {
    // The whole point: the browser fires nothing for a same-value write, so a
    // visitor re-picking the question they just collapsed got no response.
    window.location.hash = "#blessure";
    const seen = vi.fn();
    window.addEventListener("hashchange", seen);
    revealHash("blessure");
    window.removeEventListener("hashchange", seen);
    expect(seen).toHaveBeenCalled();
  });

  it("matches a percent-encoded hash against the raw slug", () => {
    // `window.location.hash` comes back encoded; the id is a raw Sanity slug.
    window.location.hash = "#caf%C3%A9";
    const seen = vi.fn();
    window.addEventListener("hashchange", seen);
    revealHash("café");
    window.removeEventListener("hashchange", seen);
    expect(seen).toHaveBeenCalled();
  });
});
