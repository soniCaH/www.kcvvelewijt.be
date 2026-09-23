/**
 * Colocated tests for the deterministic per-player figure variant + its
 * containment guard (#2635).
 *
 * Layer boundary: pure arithmetic on seeded values, no DOM, no React — the
 * guard is asserted directly against `computeFigureBoundingBox`, never by
 * rendering and measuring. See `player-figure-variant.ts` for the algorithm
 * provenance (#2542's addendum, corrected by #2590).
 */
import { describe, expect, it } from "vitest";
import {
  CONTAINMENT_MARGIN,
  FIGURE_VIEWBOX_HEIGHT,
  FIGURE_VIEWBOX_WIDTH,
  applyBottomClamp,
  applyContainmentGuard,
  computeFigureBoundingBox,
  computePlayerFigureVariant,
  djb2Seed,
  generateRawPlayerFigureVariant,
  playerFigureSeed,
  SHIRT_PATTERNS,
  SLEEVE_LENGTHS,
  STRIPE_COUNTS,
} from "./player-figure-variant";

// The real eerste-elftallen-a squad (26 outfield + keeper names), verbatim
// from `docs/design/mockups/2542-squad-photo-coverage/2542-2-variatie-studie.html`
// — the fixture the addendum's "0 clipped / 15 short → 0" numbers were
// measured against.
const A_PLOEG_SQUAD: readonly string[] = [
  "Levi Antonissen",
  "Jalal Azzaoui",
  "Jannes Bautmans",
  "Alexander Bell",
  "Amirgan Bouakhounov",
  "Gregory Boudart",
  "Arno Braspenninckx",
  "Mylan Carrasco",
  "Bixente Ceusters",
  "Rik Corthout",
  "Kevin De Jonge",
  "Michiel De Looze",
  "Stef De Reys",
  "Adil El Attabi",
  "Bilal El Bouhadifi",
  "Lucas Goovaerts",
  "Walid Houssane",
  "Tiglat Kriakos",
  "Bangali Kromah",
  "Derrick Kyere",
  "Omar Lekhechine",
  "Wout Merckaert",
  "Alec Mertens",
  "Beau Ndiaye",
  "Fahd Sakande",
  "Younes Touzani",
  "Jannes Van Hof",
  "Marnicqo Vantomme",
  "Christopher Louis Veka",
];

const BOX_EPSILON = 0.5;

describe("djb2Seed", () => {
  it("is deterministic for the same input", () => {
    expect(djb2Seed("Maxim Breugelmans")).toBe(djb2Seed("Maxim Breugelmans"));
  });

  it("produces different seeds for different names", () => {
    expect(djb2Seed("Maxim Breugelmans")).not.toBe(djb2Seed("Lars De Smet"));
  });

  it("always returns a non-negative 32-bit integer", () => {
    for (const name of A_PLOEG_SQUAD) {
      const seed = djb2Seed(name);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("computePlayerFigureVariant — determinism", () => {
  it("draws the same figure for the same seed on every call", () => {
    const first = computePlayerFigureVariant("player-id-1");
    const second = computePlayerFigureVariant("player-id-1");
    expect(second).toEqual(first);
  });

  it("draws a different figure for a different seed", () => {
    const a = computePlayerFigureVariant("player-id-1");
    const b = computePlayerFigureVariant("player-id-2");
    expect(a).not.toEqual(b);
  });
});

describe("playerFigureSeed — the seed's one owner", () => {
  it("seeds from the player's id, not a display name", () => {
    expect(playerFigureSeed({ id: "abc123" })).toBe("abc123");
  });

  it("two players sharing an id (the same player) get the same seed", () => {
    expect(playerFigureSeed({ id: "abc123" })).toBe(
      playerFigureSeed({ id: "abc123" }),
    );
  });

  it("two different ids get different seeds", () => {
    expect(playerFigureSeed({ id: "abc123" })).not.toBe(
      playerFigureSeed({ id: "xyz789" }),
    );
  });
});

// Property loops collect violations and assert once: one `expect()` per seed
// per lever spent the 5 s timeout on assertion bookkeeping under a wave
// (#3128). Checks are written `!(in range)` so a NaN counts as a violation, and
// only the first 20 are printed so one widened bound stays readable.
const FIRST = 20;

describe("generateRawPlayerFigureVariant — lever ranges", () => {
  // Sample a broad seed range rather than just the squad — the ranges are a
  // property of the PRNG draw, not of any one name.
  const seeds = Array.from({ length: 2000 }, (_, i) => i * 104_729); // scattered, not sequential
  const variants = seeds.map((seed) => ({
    seed,
    v: generateRawPlayerFigureVariant(seed),
  }));

  const SPANS = [
    ["scale", 0.84, 1.16],
    ["offsetX", -9, 9],
    ["offsetY", -7, 7],
    ["rotation", -0.9, 0.9],
    ["underprintOpacity", 0.74, 1],
    ["overprintOpacity", 0.82, 1],
    ["registrationX", -3, 4],
    ["registrationY", -3, 4],
    ["headTilt", -5, 5],
    ["headDy", -6, 6],
    ["shoulderWidth", 0.88, 1.12],
    ["build", 0.86, 1.14],
    ["lean", -3, 3],
    ["drop", -14, 16],
  ] as const;
  const CHOICES = [
    ["flip", [1, -1]],
    ["stripeCount", STRIPE_COUNTS],
    ["sleeve", SLEEVE_LENGTHS],
    ["pattern", SHIRT_PATTERNS],
  ] as const;

  it("checks every lever the variant carries — a new lever needs a span", () => {
    expect([...SPANS, ...CHOICES].map(([lever]) => lever).sort()).toEqual(
      Object.keys(variants[0].v).sort(),
    );
  });

  it("keeps every lever inside its documented span", () => {
    const bad: string[] = [];
    for (const { seed, v } of variants) {
      for (const [lever, min, max] of SPANS) {
        if (!(v[lever] >= min && v[lever] <= max)) {
          bad.push(
            `seed ${seed}: ${lever} ${v[lever]} outside [${min}, ${max}]`,
          );
        }
      }
      for (const [lever, allowed] of CHOICES) {
        if (!(allowed as readonly unknown[]).includes(v[lever])) {
          bad.push(
            `seed ${seed}: ${lever} ${v[lever]} not one of ${allowed.join(", ")}`,
          );
        }
      }
    }
    expect(bad.slice(0, FIRST)).toEqual([]);
  });

  it("draws long sleeves roughly 45% of the time", () => {
    const longCount = variants.filter(({ v }) => v.sleeve === "long").length;
    const share = longCount / variants.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.55);
  });

  it("draws every shirt pattern and both sleeve lengths across a sample", () => {
    for (const pattern of SHIRT_PATTERNS) {
      expect(variants.some(({ v }) => v.pattern === pattern)).toBe(true);
    }
    for (const sleeve of SLEEVE_LENGTHS) {
      expect(variants.some(({ v }) => v.sleeve === sleeve)).toBe(true);
    }
    for (const count of STRIPE_COUNTS) {
      expect(variants.some(({ v }) => v.stripeCount === count)).toBe(true);
    }
  });
});

describe("containment guard — the top edge (#2542 addendum)", () => {
  const boxes = Array.from({ length: 3000 }, (_, i) => i * 65_537).map(
    (seed) => ({
      seed,
      box: computeFigureBoundingBox(
        applyContainmentGuard(generateRawPlayerFigureVariant(seed)),
      ),
    }),
  );

  it("never lets the head clear the top margin, across a wide seed range", () => {
    const bad = boxes
      .filter(({ box }) => !(box.minY >= CONTAINMENT_MARGIN - BOX_EPSILON))
      .map(({ seed, box }) => `seed ${seed}: minY ${box.minY}`);
    expect(bad.slice(0, FIRST)).toEqual([]);
  });

  it("never lets a shoulder cross the side margins, across a wide seed range", () => {
    const bad = boxes
      .filter(
        ({ box }) =>
          !(
            box.minX >= CONTAINMENT_MARGIN - BOX_EPSILON &&
            box.maxX <= FIGURE_VIEWBOX_WIDTH - CONTAINMENT_MARGIN + BOX_EPSILON
          ),
      )
      .map(({ seed, box }) => `seed ${seed}: x ${box.minX}..${box.maxX}`);
    expect(bad.slice(0, FIRST)).toEqual([]);
  });
});

describe("bottom clamp — the ground line (#2590 correction)", () => {
  it("never lets the figure stop short of the viewBox bottom", () => {
    const bad: string[] = [];
    for (let i = 0; i < 3000; i += 1) {
      const seed = i * 65_537;
      const box = computeFigureBoundingBox(
        computePlayerFigureVariant(String(seed)),
      );
      if (!(box.maxY >= FIGURE_VIEWBOX_HEIGHT - BOX_EPSILON)) {
        bad.push(`seed ${seed}: maxY ${box.maxY}`);
      }
    }
    expect(bad.slice(0, FIRST)).toEqual([]);
  });

  it("leaves a figure that already bleeds past the bottom untouched", () => {
    // Find a seed whose pre-clamp box already runs past the viewBox bottom
    // and assert the clamp is a no-op for it (bleed stays free).
    let found = false;
    for (let seed = 0; seed < 5000 && !found; seed += 1) {
      const guarded = applyContainmentGuard(
        generateRawPlayerFigureVariant(seed),
      );
      const beforeClamp = computeFigureBoundingBox(guarded);
      if (beforeClamp.maxY > FIGURE_VIEWBOX_HEIGHT + 1) {
        found = true;
        const clamped = applyBottomClamp(guarded);
        // Same drop → clamp added nothing, because the bleed already clears.
        expect(clamped.drop).toBeCloseTo(guarded.drop, 5);
      }
    }
    expect(found).toBe(true);
  });
});

describe("the real A-ploeg squad — the fixture the AC numbers were measured against", () => {
  const variants = A_PLOEG_SQUAD.map((name) => ({
    name,
    variant: computePlayerFigureVariant(name),
  }));
  const boxes = variants.map(({ variant }) =>
    computeFigureBoundingBox(variant),
  );

  it("clips no figure at the top", () => {
    for (const box of boxes) {
      expect(box.minY).toBeGreaterThanOrEqual(CONTAINMENT_MARGIN - BOX_EPSILON);
    }
  });

  it("leaves no figure short at the bottom", () => {
    for (const box of boxes) {
      expect(box.maxY).toBeGreaterThanOrEqual(
        FIGURE_VIEWBOX_HEIGHT - BOX_EPSILON,
      );
    }
  });

  it("still spreads scale across the squad after the guard runs", () => {
    const scales = variants.map(({ variant }) => variant.scale);
    expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan(0.2);
  });

  it("still mirrors a meaningful share of the squad", () => {
    const mirrored = variants.filter(
      ({ variant }) => variant.flip === -1,
    ).length;
    expect(mirrored).toBeGreaterThan(0);
    expect(mirrored).toBeLessThan(A_PLOEG_SQUAD.length);
  });

  it("every shirt pattern and sleeve length survives the guard", () => {
    for (const pattern of SHIRT_PATTERNS) {
      expect(variants.some(({ variant }) => variant.pattern === pattern)).toBe(
        true,
      );
    }
    for (const sleeve of SLEEVE_LENGTHS) {
      expect(variants.some(({ variant }) => variant.sleeve === sleeve)).toBe(
        true,
      );
    }
  });
});
