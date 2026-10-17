"use client";

import { DownloadSimple } from "@/lib/icons.redesign";
import { PRESS_DOWN_CLASSES } from "@/components/design-system";
import { CLUB_BOOK_PRINT_CSS, CLUB_BOOK_PRINT_STYLE_ID } from "./print-style";

/**
 * "Download als PDF" — prints the clubboek on A4. The browser's print dialog is
 * the PDF writer; this only adds the print sheet for the length of the print.
 */
export function PdfButton({ className }: { className?: string }) {
  const handleClick = () => {
    // Idempotent — clear any leftover from a previous (or cancelled) print.
    document.getElementById(CLUB_BOOK_PRINT_STYLE_ID)?.remove();

    const style = document.createElement("style");
    style.id = CLUB_BOOK_PRINT_STYLE_ID;
    style.media = "print";
    style.textContent = CLUB_BOOK_PRINT_CSS;
    document.head.appendChild(style);

    window.addEventListener(
      "afterprint",
      () => document.getElementById(CLUB_BOOK_PRINT_STYLE_ID)?.remove(),
      { once: true },
    );
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`border-ink bg-cream-soft text-ink shadow-paper-sm text-mono-sm flex items-center gap-2 border-2 px-4 py-2.5 font-mono font-bold uppercase print:hidden ${PRESS_DOWN_CLASSES} ${className ?? ""}`}
    >
      <DownloadSimple size={16} aria-hidden />
      Download als PDF
    </button>
  );
}
