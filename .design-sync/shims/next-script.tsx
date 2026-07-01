// ponytail: next/script → no-op. Analytics/GTM loaders never run in the design
// bundle. Accept a catch-all props param so `<Script id=… strategy=…>` and
// `<Script>…children…</Script>` are drop-in usable without type errors.
export default function Script(_props: Record<string, unknown>) {
  return null;
}
