// PROTOTYPE — throwaway. Link to a board's own page (/club/bestuur,
// /club/jeugdbestuur). `tone="cream"` for dark backgrounds.
import Link from "next/link";

const BOARDS = {
  hoofdbestuur: { href: "/club/bestuur", label: "Bekijk het hoofdbestuur" },
  jeugdbestuur: {
    href: "/club/jeugdbestuur",
    label: "Bekijk het jeugdbestuur",
  },
} as const;

export function BoardLink({
  board,
  tone = "ink",
  className,
}: {
  board: keyof typeof BOARDS;
  tone?: "ink" | "cream";
  className?: string;
}) {
  const { href, label } = BOARDS[board];
  return (
    <Link
      href={href}
      className={`text-label inline-flex items-center gap-1 font-mono font-semibold uppercase underline-offset-4 hover:underline ${tone === "cream" ? "text-cream" : "text-jersey-deep"} ${className ?? ""}`}
    >
      {label} →
    </Link>
  );
}
