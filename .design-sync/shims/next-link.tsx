// ponytail: minimal next/link → <a> shim for the design bundle.
import * as React from "react";

type Href = string | { pathname?: string };

export default function Link({
  href,
  // Next-only props — swallow.
  replace,
  scroll,
  prefetch,
  shallow,
  passHref,
  locale,
  legacyBehavior,
  children,
  ...rest
}: Record<string, unknown> & { href?: Href; children?: React.ReactNode }) {
  const h = href as Href;
  const resolved = typeof h === "object" && h !== null ? (h.pathname ?? "#") : (h ?? "#");
  return (
    <a href={resolved as string} {...rest}>
      {children}
    </a>
  );
}
