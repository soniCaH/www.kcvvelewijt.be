// PROTOTYPE (#3511) — throwaway, lives only on branch prototype/3508-share-drag.
// Three ways to keep story text readable on any photo, switchable via ?variant=A|B|C.
import { notFound } from "next/navigation";
import { ThemePrototype } from "@/components/share/prototype-theme/ThemePrototype";

export default async function ShareThemePrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await searchParams;
  return <ThemePrototype variant={variant ?? "A"} />;
}
