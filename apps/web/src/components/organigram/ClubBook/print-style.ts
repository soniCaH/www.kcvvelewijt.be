/**
 * The A4 print sheet of the clubboek, injected only while the visitor prints it
 * so it can never touch another page's print (or another print of this page).
 *
 * Everything except the book is `display: none` — the book's ancestors are
 * kept (they are what contains it) but stripped of their padding and width, so
 * hidden content takes no room and nothing paginates by accident. No transform
 * scaling: the type is the type the page uses, laid out on an A4 column. The
 * sheet is the house page: `@page` margin 0, full-bleed bands at the sheet's top
 * and bottom edge and the footer above the lower band (`<PrintSheetFrame>`, fixed
 * so they repeat per page), and the content in padding 19 / 17 / 25 mm that
 * `box-decoration-break: clone` repeats on every page.
 * `print-color-adjust: exact` keeps the bands, the chip and the card fills when
 * the print dialog's "background graphics" is off.
 */
export const CLUB_BOOK_PRINT_ROOT = "club-book-print";
export const CLUB_BOOK_PRINT_STYLE_ID = "club-book-print-style";

export const CLUB_BOOK_PRINT_CSS = `
  @page { size: A4 portrait; margin: 0; }
  html, body { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
  body *:not(.${CLUB_BOOK_PRINT_ROOT}):not(.${CLUB_BOOK_PRINT_ROOT} *):not(:has(.${CLUB_BOOK_PRINT_ROOT})) { display: none !important; }
  body *:has(.${CLUB_BOOK_PRINT_ROOT}) { margin: 0 !important; padding: 0 !important; width: auto !important; max-width: none !important; height: auto !important; min-height: 0 !important; overflow: visible !important; position: static !important; border: 0 !important; box-shadow: none !important; }
  .${CLUB_BOOK_PRINT_ROOT} { padding: 19mm 17mm 25mm !important; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .${CLUB_BOOK_PRINT_ROOT}, .${CLUB_BOOK_PRINT_ROOT} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;
