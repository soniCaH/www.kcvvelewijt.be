"use client";

import { forwardRef, type ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "@/lib/icons";
import {
  getButtonClasses,
  type ButtonStyleProps,
} from "../Button/button-styles";

export interface LinkButtonProps
  extends Omit<LinkProps, "className">, Omit<ButtonStyleProps, "disabled"> {
  children: ReactNode;
  className?: string;
  withArrow?: boolean;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      withArrow = false,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        className={getButtonClasses({ variant, size, fullWidth, className })}
        {...props}
      >
        {children}

        {withArrow && (
          <ArrowRight
            size={16}
            className={cn(
              "transition-transform duration-300",
              "group-hover:translate-x-1",
            )}
            aria-hidden="true"
          />
        )}
      </Link>
    );
  },
);

LinkButton.displayName = "LinkButton";
