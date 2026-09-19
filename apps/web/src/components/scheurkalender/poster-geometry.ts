/**
 * The poster export's geometry, in one place (#2702).
 *
 * These numbers are load-bearing in two files at once — the print stylesheet in
 * `<ScheurkalenderPage>` reserves the block and lays the sheet out at
 * `SHEET_WIDTH_PX`, and `<PosterPrintScale>` measures against the same box.
 * They were hand-typed in both, plus a third time in the tests, kept in step by
 * a comment: update one and the sheet gets measured at a width the stylesheet
 * does not render it at, which silently clips fixtures off the poster.
 *
 * Its own module rather than an export from `<PosterPrintScale>`: that file is
 * `"use client"`, and every export of a client module reaches a server
 * component as a client reference, not as the number.
 */

/** CSS px per millimetre — print CSS resolves `px` at a fixed 96 dpi. */
const PX_PER_MM = 96 / 25.4;

/**
 * The poster block between the InDesign sponsor blocks
 * (`docs/design/mockups/phase-10-scheurkalender/sk2-poster-layout-locked.md`).
 * The print stylesheet reserves exactly this box inside the A2 page.
 */
export const BLOCK_WIDTH_PX = 340 * PX_PER_MM;
export const BLOCK_HEIGHT_PX = 567 * PX_PER_MM;

/**
 * Width the sheet is laid out at in print: the narrowest width at which no
 * club name wraps to a second line.
 *
 * It started as 796 — the sheet's width at the 860 px viewport the layout was
 * locked against (860 − 2 × 32 px of `<PageContainer>`'s `md:px-8`) — because
 * that is the render the owner used to screenshot. Measured against the real
 * 56-fixture 26/27 season, that width is dominated on both counts it was
 * chosen for:
 *
 * | laid out at | names wrapped | printed name |
 * | ----------- | ------------- | ------------ |
 * | 796 px      | 6             | 5.42 mm      |
 * | 860 px      | 2             | 5.53 mm      |
 * | 920 px      | 0             | 5.17 mm      |
 * | 976 px      | 0             | 4.88 mm      |
 *
 * Wrapping is not free height: six wrapped rows make the sheet tall enough that
 * the height fit, not the width fit, decides the scale — so 796 printed both
 * more wrapping *and* smaller type than 860. Past 920 the sheet stops getting
 * shorter (nothing is left to unwrap) while the type keeps shrinking, so 920 is
 * the last width that buys anything. The poster keeps a whole club name on one
 * line at the cost of 0.36 mm of type against the lock.
 */
export const SHEET_WIDTH_PX = 920;

/**
 * Fit on width alone. The stylesheet carries this as the fallback for a print
 * that never got measured; it is correct for any season short enough to fit,
 * and it is the ceiling `<PosterPrintScale>` never scales past.
 */
export const WIDTH_FIT_SCALE = BLOCK_WIDTH_PX / SHEET_WIDTH_PX;
