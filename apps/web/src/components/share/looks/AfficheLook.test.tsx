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

const draw = (coverMode: CoverMode) =>
  render(
    <AfficheLook
      content={buildArticleContent(RECAP, fieldsOf(RECAP))}
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

  it("a match report draws the final-whistle detail", () => {
    expect(draw("foto").textContent).toContain("Eindsignaal");
  });
});
