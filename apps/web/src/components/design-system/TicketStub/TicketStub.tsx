import type { CSSProperties } from "react";

export type TicketStubPosition = "overlay-tr" | "overlay-bl" | "inline";

export interface TicketStubProps {
  label: string;
  value: string;
  rotation?: number;
  position?: TicketStubPosition;
}

const POSITION_CLASS: Record<TicketStubPosition, string> = {
  "overlay-tr": "absolute top-2 right-2",
  "overlay-bl": "absolute bottom-2 left-2",
  inline: "",
};

export function TicketStub({
  label,
  value,
  rotation = 0,
  position = "inline",
}: TicketStubProps) {
  const style: CSSProperties = { transform: `rotate(${rotation}deg)` };
  return (
    <span
      data-position={position}
      style={style}
      className={`${POSITION_CLASS[position]} bg-ink text-cream shadow-paper-sm relative inline-flex flex-col items-start px-3 py-1 font-mono text-[11px] leading-none tracking-[0.08em] uppercase`}
    >
      {/* Perforated edges — small cream circles punched into the left/right */}
      <span
        aria-hidden="true"
        className="bg-cream absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rounded-full"
      />
      <span
        aria-hidden="true"
        className="bg-cream absolute top-1/2 -right-1 h-2 w-2 -translate-y-1/2 rounded-full"
      />
      <span className="text-jersey-bright">{label}</span>
      <span>{value}</span>
    </span>
  );
}
