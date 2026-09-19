// `TABLE_SANITIZE_OPTIONS` had no consumer anywhere (not even a test) once
// re-checked — it's module-private in HtmlTableBlock.tsx now, not just
// dropped from this barrel.
export { HtmlTableBlock } from "./HtmlTableBlock";
export type { HtmlTableBlockProps } from "./HtmlTableBlock";
