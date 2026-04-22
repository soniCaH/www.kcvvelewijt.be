"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-green-main shrink-0 rounded-lg bg-white px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50 print:hidden"
    >
      Afdrukken
    </button>
  );
}
