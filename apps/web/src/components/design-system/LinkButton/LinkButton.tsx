"use client";

import { forwardRef, type ReactNode } from "react";
import Link, { type LinkProps } from "next/link";
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
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        )}
      </Link>
    );
  },
);

LinkButton.displayName = "LinkButton";
