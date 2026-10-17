// PROTOTYPE (#3508) — throwaway, lives only on branch prototype/3508-share-drag.
// Three ways to rearrange the Kickoff story's sections, switchable via ?variant=A|B|C.
import { notFound } from "next/navigation";
import { DragPrototype } from "@/components/share/prototype-drag/DragPrototype";

export default async function ShareDragPrototypeRoute({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await searchParams;
  return <DragPrototype variant={variant ?? "A"} />;
}
