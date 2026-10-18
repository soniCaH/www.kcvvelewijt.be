import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { AfficheLook } from "./AfficheLook";
import { buildArticleContent, fieldsOf, type ShareItem } from "./share-content";
import type { CoverMode } from "./look-parts";

const RECAP: ShareItem = {
  kind: "article",
  slug: "verslag",
  type: "matchRecap",
  title: "Drie punten thuis",
  spans: [{ text: "Drie punten thuis", accent: false }],
  date: "zaterdag 17 oktober",
  time: "",
  location: "",
  day: "17",
  month: "okt",
  cover: {
    url: "https://cdn.sanity.io/flyer.jpg",
    hotspot: { x: 0.5, y: 0.5 },
  },
};

const draw = (coverMode: CoverMode, item: ShareItem = RECAP) =>
  render(
    <AfficheLook
      content={buildArticleContent(item, fieldsOf(item))}
      format="story"
      theme="licht"
      wash="normaal"
      coverMode={coverMode}
      blocks={{}}
      fallbackIndex={0}
    />,
  ).container;

describe("AfficheLook", () => {
  it("Affiche wazig grades the blurred copy only; the taped flyer keeps its own colours", () => {
    const [blurred, flyer] = Array.from(
      draw("affiche_wazig").querySelectorAll("img"),
    );
    expect(blurred!.style.filter).toContain("sepia(0.25)");
    expect(blurred!.style.filter).toContain("blur(16px)");
    expect(flyer!.style.filter).toBe("");
  });

  it("Foto grades the cover itself", () => {
    const [cover] = Array.from(draw("foto").querySelectorAll("img"));
    expect(cover!.style.filter).toContain("sepia(0.25)");
    expect(cover!.style.filter).not.toContain("blur");
  });

  it("a match report draws the final-whistle detail; a preview draws vs.", () => {
    expect(draw("foto").textContent).toContain("Eindsignaal");
    expect(
      draw("foto", { ...RECAP, type: "matchPreview" }).textContent,
    ).toContain("vs.");
  });

  it("a longer title steps down in size, so it never runs off the canvas", () => {
    const titleSize = (length: number) => {
      const text = "x".repeat(length);
      const item = { ...RECAP, title: text, spans: [{ text, accent: false }] };
      const el = Array.from(
        draw("foto", item).querySelectorAll<HTMLElement>("[style]"),
      ).find((n) => n.style.fontSize && n.textContent === text)!;
      return parseFloat(el.style.fontSize);
    };
    const sizes = [20, 40, 60, 90].map(titleSize);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(new Set(sizes).size).toBe(4);
  });
});
