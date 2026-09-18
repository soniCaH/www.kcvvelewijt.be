/**
 * PosterPrintScale Tests
 *
 * The fit is the only thing standing between a long season and fixtures
 * clipped off the bottom of the poster, so both bounds get a case.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { PosterPrintScale } from "./PosterPrintScale";
import { BLOCK_HEIGHT_PX, WIDTH_FIT_SCALE } from "./poster-geometry";

/**
 * A sheet in the document with a stubbed height — jsdom lays nothing out. It
 * carries the print-only dateline the real sheet has, so the branch that forces
 * that into the measurement is exercised.
 */
function mountSheet(scrollHeight: number): HTMLElement {
  const sheet = document.createElement("div");
  sheet.className = "sk-poster-sheet";
  Object.defineProperty(sheet, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  const footer = document.createElement("p");
  footer.className = "sk-poster-footer";
  footer.style.display = "none";
  sheet.appendChild(footer);
  document.body.appendChild(sheet);
  return sheet;
}

function readScale(): number {
  return Number(
    document.documentElement.style.getPropertyValue("--sk-poster-scale"),
  );
}

afterEach(() => {
  document.documentElement.style.removeProperty("--sk-poster-scale");
  document.querySelectorAll(".sk-poster-sheet").forEach((el) => el.remove());
});

describe("PosterPrintScale", () => {
  it("scales a long season down so it fits the block height", () => {
    // Taller than 26/27, which fits on width alone at the current layout
    // width — the height fit only takes over past ~1534 px.
    const sheetHeight = 1800;
    mountSheet(sheetHeight);
    render(<PosterPrintScale />);

    window.dispatchEvent(new Event("beforeprint"));

    expect(readScale()).toBeCloseTo(BLOCK_HEIGHT_PX / sheetHeight, 4);
    expect(readScale()).toBeLessThan(WIDTH_FIT_SCALE);
  });

  it("never scales a short season past the block width", () => {
    mountSheet(200);
    render(<PosterPrintScale />);

    window.dispatchEvent(new Event("beforeprint"));

    expect(readScale()).toBeCloseTo(WIDTH_FIT_SCALE, 4);
  });

  it("measures on mount, so a browser that never fires beforeprint still fits", () => {
    const sheetHeight = 1800;
    mountSheet(sheetHeight);

    render(<PosterPrintScale />);

    expect(readScale()).toBeCloseTo(BLOCK_HEIGHT_PX / sheetHeight, 4);
  });

  it("puts the sheet and its dateline back the way it found them", () => {
    const sheet = mountSheet(1464);
    sheet.style.width = "500px";
    const footer = sheet.querySelector<HTMLElement>(".sk-poster-footer")!;
    render(<PosterPrintScale />);

    window.dispatchEvent(new Event("beforeprint"));

    expect(sheet.style.width).toBe("500px");
    // Restored to what it was, not to a hardcoded "none" — the dateline is
    // hidden by a class on screen, and forcing an inline value would change
    // what the print stylesheet is allowed to do with it.
    expect(footer.style.display).toBe("none");
  });

  it("re-measures on a FontFaceSet loadingdone event (#2822)", () => {
    // Stub `document.fonts` with ONLY a `loadingdone` subscription (no
    // `ready`) — proves the re-measure comes through the shared
    // `useWebfontSwap` trigger, not the removed `fonts.ready` check.
    let loadingDoneHandler: (() => void) | undefined;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: {
        addEventListener: (event: string, handler: () => void) => {
          if (event === "loadingdone") loadingDoneHandler = handler;
        },
        removeEventListener: vi.fn(),
      },
    });

    try {
      // Mounts with a short sheet (width-fit scale)...
      const sheet = mountSheet(200);
      render(<PosterPrintScale />);
      expect(readScale()).toBeCloseTo(WIDTH_FIT_SCALE, 4);

      // ...then Freight swaps in and the sheet grows taller.
      Object.defineProperty(sheet, "scrollHeight", {
        configurable: true,
        value: 1800,
      });
      loadingDoneHandler?.();

      expect(readScale()).toBeCloseTo(BLOCK_HEIGHT_PX / 1800, 4);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (document as any).fonts;
    }
  });

  it("stops measuring once unmounted", () => {
    // Height-limited, so the replacement sheet below would measure to a
    // different scale — otherwise a leaked listener would look like a pass.
    mountSheet(1800);
    const { unmount } = render(<PosterPrintScale />);
    const scaleAtUnmount = readScale();
    unmount();

    // A second sheet that would measure differently — the scale must not move.
    document.querySelectorAll(".sk-poster-sheet").forEach((el) => el.remove());
    mountSheet(200);
    window.dispatchEvent(new Event("beforeprint"));

    expect(readScale()).toBe(scaleAtUnmount);
  });
});
