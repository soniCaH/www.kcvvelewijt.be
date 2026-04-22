import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export interface ScrollArrowButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  variant?: "light" | "dark";
  className?: string;
}

export function ScrollArrowButton({
  direction,
  onClick,
  variant = "light",
  className,
}: ScrollArrowButtonProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  const positionClass = direction === "left" ? "left-0" : "right-0";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2",
        "h-10 w-10 rounded-full shadow-md",
        "flex items-center justify-center",
        "transition-colors",
        "focus:ring-kcvv-green-bright focus:ring-2 focus:ring-offset-2 focus:outline-none",
        variant === "light"
          ? "text-kcvv-green-bright hover:bg-kcvv-green-bright bg-white hover:text-white"
          : "bg-white/20 text-white hover:bg-white/30",
        positionClass,
        className,
      )}
      aria-label={`Scroll ${direction}`}
    >
      <Icon size={20} />
    </button>
  );
}
