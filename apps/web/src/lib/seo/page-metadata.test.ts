import { describe, it, expect } from "vitest";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { buildPageMetadata } from "./page-metadata";

describe("buildPageMetadata", () => {
  it("sets the absolute canonical URL from path", () => {
    const meta = buildPageMetadata({
      title: "Contact | KCVV Elewijt",
      description: "Contacteer KCVV Elewijt.",
      path: "/club/contact",
    });
    expect(meta).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/club/contact`,
    );
  });

  it("falls back to DEFAULT_OG_IMAGE when no ogImage is given", () => {
    const meta = buildPageMetadata({
      title: "T",
      description: "D",
      path: "/x",
    });
    const og = meta.openGraph as { images?: unknown[]; url?: string };
    expect(og.images).toEqual([DEFAULT_OG_IMAGE]);
    expect(og.url).toBe(`${SITE_CONFIG.siteUrl}/x`);
  });

  it("uses the supplied ogImage over the default", () => {
    const img = { url: "https://cdn.example/og.png", alt: "Foto" };
    const meta = buildPageMetadata({
      title: "T",
      description: "D",
      path: "/x",
      ogImage: img,
    });
    const og = meta.openGraph as { images?: unknown[] };
    expect(og.images).toEqual([img]);
  });

  it("defaults openGraph title/description to the page title/description", () => {
    const meta = buildPageMetadata({
      title: "Zoeken | KCVV Elewijt",
      description: "Doorzoek de website.",
      path: "/zoeken",
    });
    const og = meta.openGraph as { title?: string; description?: string };
    expect(og.title).toBe("Zoeken | KCVV Elewijt");
    expect(og.description).toBe("Doorzoek de website.");
  });

  it("honours tailored ogTitle/ogDescription overrides", () => {
    const meta = buildPageMetadata({
      title: "KCVV Ultras | KCVV Elewijt",
      description: "Supportersclub van KCVV Elewijt: De Ultra's!",
      path: "/club/ultras",
      ogTitle: "KCVV Ultra's 55 - KCVV Elewijt",
      ogDescription: "Supportersclub van KCVV Elewijt: De Ultra's!",
    });
    const og = meta.openGraph as { title?: string };
    expect(og.title).toBe("KCVV Ultra's 55 - KCVV Elewijt");
  });

  it("omits keywords unless provided", () => {
    expect(
      buildPageMetadata({ title: "T", description: "D", path: "/x" }),
    ).not.toHaveProperty("keywords");
    expect(
      buildPageMetadata({
        title: "T",
        description: "D",
        path: "/x",
        keywords: ["a", "b"],
      }),
    ).toHaveProperty("keywords", ["a", "b"]);
  });
});
