/**
 * The A4 print sheet of the clubboek, injected only while the visitor prints it
 * so it can never touch another page's print (or another print of this page).
 *
 * Everything except the book is `display: none` — the book's ancestors are
 * kept (they are what contains it) but stripped of their padding and width, so
 * hidden content takes no room and nothing paginates by accident. No transform
 * scaling: the type is the type the page uses, laid out on an A4 column.
 */
export const CLUB_BOOK_PRINT_ROOT = "club-book-print";
export const CLUB_BOOK_PRINT_STYLE_ID = "club-book-print-style";

export const CLUB_BOOK_PRINT_CSS = `
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
  body *:not(.${CLUB_BOOK_PRINT_ROOT}):not(.${CLUB_BOOK_PRINT_ROOT} *):not(:has(.${CLUB_BOOK_PRINT_ROOT})) { display: none !important; }
  body *:has(.${CLUB_BOOK_PRINT_ROOT}) { margin: 0 !important; padding: 0 !important; width: auto !important; max-width: none !important; height: auto !important; min-height: 0 !important; overflow: visible !important; position: static !important; border: 0 !important; box-shadow: none !important; }
`;
