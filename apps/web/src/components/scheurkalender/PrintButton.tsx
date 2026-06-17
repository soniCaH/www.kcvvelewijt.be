"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-ink text-ink hover:bg-cream-soft shrink-0 border-2 bg-white px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase transition-colors print:hidden"
    >
      Afdrukken
    </button>
  );
}
