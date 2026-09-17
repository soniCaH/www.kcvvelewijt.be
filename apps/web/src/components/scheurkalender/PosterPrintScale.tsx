"use client";

import { useCallback, useEffect } from "react";
import { useWebfontSwap } from "@/hooks/useWebfontSwap";
import {
  BLOCK_HEIGHT_PX,
  BLOCK_WIDTH_PX,
  SHEET_WIDTH_PX,
} from "./poster-geometry";

/**
 * Scales the poster sheet to fit the printed block (#2702).
 *
 * A fixed scale factor cannot do this. The sheet's width is known, but its
 * *height* is the season: 56 fixtures across nine months in 26/27, and a
 * different number every year. Scaling on width alone overflowed the block by
 * ~44 mm on the first real export and `overflow: hidden` silently ate the back
 * half of December — the failure mode a poster cannot have.
 *
 * So the factor is measured, the same way `<VolledigOrganigram>` measures its
 * chart before printing. Two differences, both because this sheet is artwork
 * rather than a paper copy: the fit is against the poster block instead of the
 * paper, and it runs on `beforeprint` rather than a button click, so `Cmd+P`
 * gets it too — the club exports through the browser's PDF writer, not through
 * the button.
 *
 * Measuring cannot wait for the print layout (`beforeprint` fires before it),
 * and the on-screen sheet is a different width at every viewport, so the height
 * is read with the print width forced on — one forced reflow per measurement.
 * It runs on mount, again once the real webfont swap lands (via the shared
 * `useWebfontSwap` trigger, #2822 — a no-op when nothing was loading), and
 * again before printing; the page is a private tool one person opens to
 * export a poster, so that costs nothing worth caching against.
 */
export function PosterPrintScale() {
  const applyScale = useCallback(() => {
    const sheet = document.querySelector<HTMLElement>(".sk-poster-sheet");
    if (!sheet) return;

    // The dateline is `hidden print:block`, so on screen it contributes no
    // height. Left out of the measurement it is left out of the fit, and the
    // sheet prints that much too tall — the last fixtures fall off the
    // bottom. Force it in for the reading, exactly like the width.
    const footer = sheet.querySelector<HTMLElement>(".sk-poster-footer");
    const previousWidth = sheet.style.width;
    const previousFooterDisplay = footer?.style.display ?? "";
    sheet.style.width = `${SHEET_WIDTH_PX}px`;
    if (footer) footer.style.display = "block";
    const sheetHeight = sheet.scrollHeight;
    sheet.style.width = previousWidth;
    if (footer) footer.style.display = previousFooterDisplay;

    // Never scale up past the block: a short season should print at the
    // locked type size, not stretch to fill the sheet.
    const scale = Math.min(
      BLOCK_WIDTH_PX / SHEET_WIDTH_PX,
      BLOCK_HEIGHT_PX / sheetHeight,
    );
    document.documentElement.style.setProperty(
      "--sk-poster-scale",
      String(scale),
    );
  }, []);

  // Web fonts change the height — re-measure via the shared webfont-swap
  // trigger (#2822) once the real swap lands. Nothing to guard for a warm
  // cache: `loadingdone` simply never fires when there is nothing left to
  // load, so this costs nothing extra there either.
  useWebfontSwap(applyScale);

  useEffect(() => {
    // Measure on mount, not only on `beforeprint`. WebKit never fires that
    // event, so on Safari — the likely "Save as PDF" route on a Mac — the
    // sheet would keep the width-only fallback and clip; the same gap opens if
    // Cmd+P beats hydration. Nothing about the measurement needs print state,
    // so taking it early costs one reflow and closes both.
    applyScale();
    window.addEventListener("beforeprint", applyScale);
    return () => window.removeEventListener("beforeprint", applyScale);
  }, [applyScale]);

  return null;
}
