"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const SCROLL_AMOUNT = 200;
const DEAD_ZONE = 10;

export interface UseScrollHintReturn<T extends HTMLElement = HTMLElement> {
  scrollRef: React.RefObject<T | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
}

export function useScrollHint<
  T extends HTMLElement = HTMLElement,
>(): UseScrollHintReturn<T> {
  const scrollRef = useRef<T | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > DEAD_ZONE);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - DEAD_ZONE);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  const scrollLeftFn = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft - SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  const scrollRightFn = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft + SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }, []);

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    scrollLeft: scrollLeftFn,
    scrollRight: scrollRightFn,
  };
}
