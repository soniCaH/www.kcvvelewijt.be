// ponytail: static next/navigation stubs — enough for "use client" components
// that read the current path / params in the design bundle (no real routing).
const noop = () => {};

export function usePathname() {
  return "/";
}
export function useSearchParams() {
  return new URLSearchParams();
}
export function useRouter() {
  return { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop };
}
export function useParams() {
  return {};
}
export function useSelectedLayoutSegment() {
  return null;
}
export function useSelectedLayoutSegments() {
  return [] as string[];
}
export function redirect() {}
export function permanentRedirect() {}
export function notFound() {}
export const RedirectType = { push: "push", replace: "replace" } as const;
