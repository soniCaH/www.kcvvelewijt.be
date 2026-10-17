// PROTOTYPE — throwaway. A7 = A5's key-figure cards (contact visible, A6's why-line) on top of A1's clubboek ledgers.
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { ClubBook } from "./VariantA1";
import { KeyCards } from "./VariantA5";

export function VariantA7({
  nodes,
  paths,
}: {
  nodes: OrgChartNode[];
  paths: ResponsibilityPath[];
}) {
  return (
    <div data-testid="proto-variant-a7" className="flex flex-col gap-12">
      <KeyCards nodes={nodes} />
      <ClubBook nodes={nodes} paths={paths} />
    </div>
  );
}
