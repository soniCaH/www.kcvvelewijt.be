/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
} from "@/components/design-system";
import { ShieldCheck } from "@/lib/icons.redesign";
import {
  API_LINE,
  ETHICS,
  ETHICS_AFTER_SLUG,
  GROUPS,
  INTRO_INDEX,
  INTRO_LEAD,
  INTRO_SAFE,
  pagesLabel,
} from "./prototypeData";
import {
  PdfButton,
  PrototypeClosing,
  Rich,
  type Closing,
} from "./PrototypeShared";

// Variant C — "Index + list": API band at the top, a sticky group index on
// desktop, one compact row per document. Built for scanning.

const ROW_GRID = "sm:grid sm:grid-cols-[1fr_11rem_5rem_auto] sm:items-center";

const EthicsRow = () => (
  <li className="border-ink/20 bg-cream-soft border-b px-4 py-5">
    <p className="font-display text-ink text-display-sm font-bold italic">
      {ETHICS.title}
    </p>
    <p className="text-body-sm text-ink mt-1">{ETHICS.lead}</p>
    <ol className="text-body-sm text-ink mt-3 grid list-decimal gap-x-8 gap-y-1 pl-6 md:grid-cols-2">
      {ETHICS.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
    <p className="text-body-sm text-ink-muted mt-3">{ETHICS.after}</p>
  </li>
);

export const VariantCPrototype = ({
  showCode,
  closing,
}: {
  showCode: boolean;
  closing: Closing;
}) => (
  <>
    <section
      aria-label="Aanspreekpunt Integriteit"
      className="bg-jersey-deep-dark text-cream border-ink border-b-2"
    >
      <PageContainer className="[&_.prose-link]:text-cream! flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:gap-6">
        <ShieldCheck size={32} aria-hidden="true" className="shrink-0" />
        <p className="text-body-sm">
          <Rich parts={INTRO_SAFE} /> <Rich parts={API_LINE} />
        </p>
      </PageContainer>
    </section>

    <PageContainer className="py-12 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-12">
      <nav aria-label="Op deze pagina" className="hidden lg:block">
        <div className="sticky top-28">
          <MonoLabel tone="muted">Op deze pagina</MonoLabel>
          <ol className="border-ink mt-3 flex flex-col gap-2 border-l-2 pl-4">
            {GROUPS.map((group) => (
              <li key={group.id}>
                <a
                  href={`#c-${group.id}`}
                  className="text-body-sm text-ink hover:text-jersey-deep font-medium"
                >
                  {group.title}
                </a>
                <span className="text-label-sm text-ink-muted ml-1 font-mono">
                  ({group.docs.length})
                </span>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <div className="min-w-0">
        <div className="text-body-md text-ink flex max-w-[var(--container-prose)] flex-col gap-3">
          <p>
            <Rich parts={INTRO_LEAD} />
          </p>
          <p>
            <Rich parts={INTRO_INDEX} />
          </p>
        </div>

        {GROUPS.map((group) => (
          <section
            key={group.id}
            id={`c-${group.id}`}
            aria-labelledby={`c-h-${group.id}`}
            className="mt-12 scroll-mt-28"
          >
            <EditorialHeading
              id={`c-h-${group.id}`}
              level={2}
              size="display-md"
            >
              {group.title}
            </EditorialHeading>
            <div
              aria-hidden="true"
              className={`border-ink text-label-sm text-ink-muted mt-4 hidden border-b-2 px-4 pb-2 font-mono uppercase ${ROW_GRID}`}
            >
              <span>Document</span>
              <span>Voor wie</span>
              <span>Bladen</span>
              <span />
            </div>
            <ul className="border-ink mt-4 border-t-2 sm:mt-0 sm:border-t-0">
              {group.docs.flatMap((doc) => [
                <li
                  key={doc.slug}
                  className={`border-ink/20 flex flex-col gap-2 border-b px-4 py-4 sm:gap-4 ${ROW_GRID}`}
                >
                  <div className="min-w-0">
                    <p className="text-body-md text-ink font-bold">
                      {doc.title}
                    </p>
                    <p className="text-body-sm text-ink-muted mt-1">
                      <Rich parts={doc.intro} />
                    </p>
                  </div>
                  <span className="text-body-sm text-ink">
                    <span className="sm:hidden">Voor: </span>
                    {doc.forWho}
                  </span>
                  <span className="text-label text-ink font-mono">
                    {pagesLabel(doc.pages)}
                  </span>
                  <span>
                    <PdfButton doc={doc} compact />
                  </span>
                </li>,
                ...(showCode && doc.slug === ETHICS_AFTER_SLUG
                  ? [<EthicsRow key="ethics" />]
                  : []),
              ])}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
    <PrototypeClosing closing={closing} />
  </>
);
