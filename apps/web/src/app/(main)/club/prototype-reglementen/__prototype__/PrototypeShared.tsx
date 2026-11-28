/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import Link from "next/link";
import { CtaBand, PageContainer } from "@/components/design-system";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { DownloadSimple } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import {
  CLOSING_LINE,
  pagesLabel,
  pdfHref,
  type Inline,
  type PrototypeDoc,
} from "./prototypeData";

export type Closing = "line" | "cta";

/** Renders an `Inline[]` run: plain text, `<strong>`, and `.prose-link` links. */
export const Rich = ({ parts }: { parts: Inline[] }) => (
  <>
    {parts.map((part, i) => {
      if (typeof part === "string") return part;
      if (part.strong) return <strong key={i}>{part.text}</strong>;
      if (part.href?.startsWith("/"))
        return (
          <Link key={i} href={part.href} className="prose-link">
            {part.text}
          </Link>
        );
      return (
        <a key={i} href={part.href} className="prose-link">
          {part.text}
        </a>
      );
    })}
  </>
);

/** Compact stamped download button — the doc's PDF (dummy href until Sanity). */
export const PdfButton = ({
  doc,
  compact = false,
}: {
  doc: PrototypeDoc;
  compact?: boolean;
}) => (
  <a
    href={pdfHref(doc.slug)}
    aria-label={`Download ${doc.label} (PDF, ${pagesLabel(doc.pages)})`}
    className={cn(
      getButtonClasses({ variant: "primary", size: "sm" }),
      "inline-flex items-center gap-2 whitespace-nowrap",
      compact && "px-4",
    )}
  >
    <DownloadSimple size={14} aria-hidden="true" />
    {compact ? "PDF" : "Download"}
  </a>
);

/** The page's closing for variants B and C: the plain sentence or the CTA band. */
export const PrototypeClosing = ({ closing }: { closing: Closing }) =>
  closing === "cta" ? (
    <PrototypeCtaBand />
  ) : (
    <PageContainer width="prose" className="pb-16">
      <p className="text-body-md text-ink border-ink border-t-2 pt-6">
        <Rich parts={CLOSING_LINE} />
      </p>
    </PageContainer>
  );

/** Big closing CTA in the `<JeugdCtaBand>` pattern: the shared `<CtaBand>`. */
export const PrototypeCtaBand = () => (
  <CtaBand
    ariaLabel="Hulp vragen"
    heading="Staat je vraag er niet bij?"
    emphasis={{ text: "er niet bij", tone: "warm" }}
    lead="Op de hulppagina vind je altijd de juiste persoon."
    buttonLabel={
      <>
        Naar de hulppagina <span aria-hidden="true">+</span>
      </>
    }
    href="/hulp"
  />
);
