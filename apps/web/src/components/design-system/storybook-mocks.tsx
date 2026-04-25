/**
 * Shared mock visuals for `UI/SectionStack` and `UI/SectionTransition`
 * Storybook stories. A CSS gradient stands in for a real photographic
 * backdrop so stories stay deterministic and CSP-safe.
 */

export interface MockBackdropProps {
  /** Optional caption rendered in the top-right corner. */
  label?: string;
}

export function MockBackdrop({ label }: MockBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255,215,0,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(0,135,85,0.5), transparent 60%), linear-gradient(135deg, #0a1a14 0%, #1e2024 50%, #0a1a14 100%)",
      }}
    >
      {label && (
        <span className="absolute top-4 right-4 text-xs font-bold tracking-widest text-white uppercase opacity-70">
          {label}
        </span>
      )}
    </div>
  );
}
