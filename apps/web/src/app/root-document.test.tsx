import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RootDocument } from "./root-document";

/**
 * The Typekit loader (#3387). The kit's JavaScript embed downloads every face
 * in the kit (19 files) to fire its active/inactive events; the CSS embed
 * declares the same `@font-face` rules and lets the browser fetch only the
 * faces the page renders. The loader stays an inline `afterInteractive`
 * script so the stylesheet never blocks first render.
 */
const KIT = "cvo5raz";

vi.mock("next/font/google", () => ({
  IBM_Plex_Mono: () => ({ variable: "mock-plex-mono" }),
}));

// Next's own client component renders nothing on the server (it injects after
// hydration), so stand it in with a plain `<script>` that keeps its strategy.
vi.mock("next/script", () => ({
  default: ({
    children,
    strategy,
    id,
  }: {
    children: string;
    strategy: string;
    id: string;
  }) => (
    <script id={id} data-strategy={strategy}>
      {children}
    </script>
  ),
}));

function render() {
  return renderToStaticMarkup(
    <RootDocument>
      <main />
    </RootDocument>,
  );
}

/**
 * Parses the markup into an inert `<template>` fragment — a parsed document
 * would make happy-dom fetch the preload/stylesheet links over the network.
 */
function parse(markup: string) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content;
}

/**
 * Runs the inline `typekit-init` script against a stub document and returns
 * what it appended to `<head>` — the real happy-dom document would try to
 * fetch the stylesheet over the network.
 */
function runLoader(markup: string) {
  const script = parse(markup).querySelector("#typekit-init");
  expect(script, "typekit-init script is rendered").not.toBeNull();
  const appended: Record<string, string>[] = [];
  const fakeDocument = {
    createElement: (tag: string) => ({ tag }),
    head: { appendChild: (el: Record<string, string>) => appended.push(el) },
  };
  new Function("document", script!.textContent ?? "")(fakeDocument);
  return appended;
}

describe("RootDocument — Typekit loader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("injects the kit's CSS embed, not its JS embed", () => {
    vi.stubEnv("NEXT_PUBLIC_TYPEKIT_ID", KIT);
    const markup = render();

    expect(markup).not.toContain(`${KIT}.js`);
    expect(markup).not.toContain("Typekit.load");

    expect(runLoader(markup)).toEqual([
      {
        tag: "link",
        rel: "stylesheet",
        crossOrigin: "anonymous",
        href: `https://use.typekit.net/${KIT}.css`,
      },
    ]);
  });

  it("preloads the CSS during parse and loads the stylesheet after interactive", () => {
    vi.stubEnv("NEXT_PUBLIC_TYPEKIT_ID", KIT);
    const doc = parse(render());

    const preload = doc.querySelector('link[rel="preload"]');
    expect(preload?.getAttribute("as")).toBe("style");
    expect(preload?.getAttribute("href")).toBe(
      `https://use.typekit.net/${KIT}.css`,
    );
    expect(preload?.getAttribute("crossorigin")).toBe("anonymous");

    expect(
      doc.querySelector("#typekit-init")?.getAttribute("data-strategy"),
    ).toBe("afterInteractive");
    // Never a render-blocking stylesheet in the server markup, and no
    // preconnect: the preload already warms the one host the fonts share.
    expect(doc.querySelector('link[rel="stylesheet"]')).toBeNull();
    expect(doc.querySelector('link[rel="preconnect"]')).toBeNull();
  });

  it("injects a stylesheet whose crossOrigin matches the preload", () => {
    vi.stubEnv("NEXT_PUBLIC_TYPEKIT_ID", KIT);
    const markup = render();
    const preload = parse(markup).querySelector('link[rel="preload"]');

    expect(runLoader(markup)[0]).toMatchObject({
      href: preload?.getAttribute("href"),
      crossOrigin: preload?.getAttribute("crossorigin"),
    });
  });

  it("renders no loader and no preconnect when no kit id is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TYPEKIT_ID", "");
    const markup = render();

    expect(markup).not.toContain("typekit");
  });
});
