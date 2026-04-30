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
  return cn(
    // Base styles
    "group inline-flex items-center justify-center gap-2",
    "font-medium transition-all duration-300",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",

    // Focus ring per variant. Primary moved to jersey-deep on the redesign
    // surface (PRD §6.1); other variants stay on legacy ring until 2.A.3.
    {
      "focus-visible:ring-jersey-deep": variant === "primary",
      "focus-visible:ring-kcvv-green": variant !== "primary",
    },

    // Variant styles
    {
      "bg-jersey text-cream hover:brightness-110": variant === "primary",
      "bg-kcvv-gray text-white hover:bg-kcvv-gray-dark":
        variant === "secondary",
      "border-2 border-kcvv-green-bright text-kcvv-green-bright hover:bg-kcvv-green-bright hover:text-white":
        variant === "ghost",
      "text-kcvv-green-bright underline-offset-4 hover:underline":
        variant === "link",
    },

    // Disabled styles (only for actual disabled elements)
    disabled && "opacity-50 cursor-not-allowed",
    disabled && {
      "hover:brightness-100": variant === "primary",
      "hover:bg-kcvv-gray": variant === "secondary",
      "hover:bg-transparent hover:text-kcvv-green-bright": variant === "ghost",
      "hover:no-underline": variant === "link",
    },

    // Size styles
    {
      "text-sm px-6 py-2 rounded": size === "sm",
      "text-base px-8 py-3 rounded": size === "md",
      "text-lg px-10 py-4 rounded": size === "lg",
    },

    // Full width
    { "w-full": fullWidth },

    className,
  );
}
