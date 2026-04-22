"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "@/lib/icons";

export interface HorizontalSliderProps {
  /** Content to scroll horizontally */
  children: ReactNode;
  /** Optional section heading */
  title?: string;
  /** Theme variant — "dark" for dark background sections */
  theme?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
}

export const HorizontalSlider = ({
  children,
  title,
  theme,
  className,
}: HorizontalSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const id = setTimeout(checkScroll, 0);
    return () => clearTimeout(id);
  }, [children, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("", className)}>
      {title && (
        <h3
          className={cn(
            "mb-3 text-lg font-bold",
            theme === "dark" ? "text-kcvv-white" : "text-kcvv-black",
          )}
        >
          {title}
        </h3>
      )}

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className={cn(
              "absolute top-1/2 left-0 z-10 flex -translate-x-5 -translate-y-1/2",
              "h-10 w-10 items-center justify-center transition-colors",
              theme === "dark"
                ? "bg-kcvv-black border-kcvv-green-bright/50 hover:bg-kcvv-green-bright/10 hover:border-kcvv-green-bright rounded-sm border"
                : "rounded-full bg-white shadow-md hover:bg-gray-50",
            )}
            aria-label="Scroll naar links"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5",
                theme === "dark"
                  ? "text-kcvv-green-bright"
                  : "text-kcvv-green-dark",
              )}
            />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          data-slot="scroll-track"
          className="overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex min-w-max gap-3">{children}</div>
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className={cn(
              "absolute top-1/2 right-0 z-10 flex translate-x-5 -translate-y-1/2",
              "h-10 w-10 items-center justify-center transition-colors",
              theme === "dark"
                ? "bg-kcvv-black border-kcvv-green-bright/50 hover:bg-kcvv-green-bright/10 hover:border-kcvv-green-bright rounded-sm border"
                : "rounded-full bg-white shadow-md hover:bg-gray-50",
            )}
            aria-label="Scroll naar rechts"
          >
            <ChevronRight
              className={cn(
                "h-5 w-5",
                theme === "dark"
                  ? "text-kcvv-green-bright"
                  : "text-kcvv-green-dark",
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
};
