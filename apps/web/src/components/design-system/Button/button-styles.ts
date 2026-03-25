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
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kcvv-green focus-visible:ring-offset-2",

    // Variant styles
    {
      "bg-kcvv-green-bright text-white hover:bg-kcvv-green-bright/50":
        variant === "primary",
      "bg-gray-600 text-white hover:bg-gray-800": variant === "secondary",
      "border-2 border-kcvv-green-bright text-kcvv-green-bright hover:bg-kcvv-green-bright hover:text-white":
        variant === "ghost",
      "text-kcvv-green-bright underline-offset-4 hover:underline":
        variant === "link",
    },

    // Disabled styles (only for actual disabled elements)
    disabled && "opacity-50 cursor-not-allowed",
    disabled && {
      "hover:bg-kcvv-green-bright": variant === "primary",
      "hover:bg-gray-600": variant === "secondary",
      "hover:bg-transparent hover:text-kcvv-green-bright": variant === "ghost",
      "hover:no-underline": variant === "link",
    },

    // Size styles
    {
      "text-sm px-6 py-2 rounded-[0.25em]": size === "sm",
      "text-base px-8 py-3 rounded-[0.25em]": size === "md",
      "text-lg px-10 py-4 rounded-[0.25em]": size === "lg",
    },

    // Full width
    { "w-full": fullWidth },

    className,
  );
}
