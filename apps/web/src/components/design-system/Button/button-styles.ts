import { cn } from "@/lib/utils/cn";
import type { ButtonVariant, ButtonSize } from "./Button";

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function getButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
}: ButtonStyleProps): string {
  // All variants are "stamped" — they share the retro paper-shadow + press-down
  // hover. Inverted uses the muted shadow so the offset stays visible against
  // the dark surface it sits on.
  const shadowClass =
    variant === "inverted" ? "shadow-paper-sm-soft" : "shadow-paper-sm";

  return cn(
    "group inline-flex items-center justify-center gap-2",
    "font-medium transition-[translate,box-shadow,background-color,opacity] duration-300",
    "cursor-pointer",
    "rounded-none border-2 border-ink",

    {
      // No hover fill: brightness-110 relit jersey-deep to #00884d and dropped
      // cream back under the shade step #2395 bought. The canonical press-down
      // below is primary's whole hover.
      "bg-jersey-deep text-cream": variant === "primary",
      "bg-cream text-ink hover:bg-cream-soft": variant === "inverted",
      "bg-cream-soft text-ink hover:bg-cream": variant === "secondary",
      "bg-transparent text-ink hover:bg-ink/5": variant === "ghost",
    },

    shadowClass,
    "hover:shadow-none hover:translate-x-1 hover:translate-y-1",

    disabled && "opacity-50 cursor-not-allowed",
    disabled && [
      "hover:translate-x-0 hover:translate-y-0",
      variant === "inverted"
        ? "hover:shadow-paper-sm-soft"
        : "hover:shadow-paper-sm",
    ],
    // On disabled, neutralise each variant's hover-fill back to its own base
    // colour so the cursor-not-allowed button never appears to react. Primary
    // has no hover fill to neutralise.
    disabled && {
      "hover:bg-cream": variant === "inverted",
      "hover:bg-cream-soft": variant === "secondary",
      "hover:bg-transparent": variant === "ghost",
    },

    {
      "text-sm px-6 py-2": size === "sm",
      "text-base px-8 py-3": size === "md",
      "text-lg px-10 py-4": size === "lg",
    },

    { "w-full": fullWidth },

    className,
  );
}
