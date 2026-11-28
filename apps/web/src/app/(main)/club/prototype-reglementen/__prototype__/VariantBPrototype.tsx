/** PROTOTYPE — throwaway. Do not ship. See #3911. */

import {
  EditorialHeading,
  MonoLabel,
  PageContainer,
  SectionHeader,
  TapedCard,
} from "@/components/design-system";
import { ShieldCheck } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import {
  API_LINE,
  ETHICS,
  ETHICS_AFTER_SLUG,
  GROUPS,
  INTRO_INDEX,
  INTRO_LEAD,
  INTRO_SAFE,
  pagesLabel,
  type PrototypeDoc,
} from "./prototypeData";
import {
  PdfButton,
  PrototypeClosing,
  Rich,
  type Closing,
} from "./PrototypeShared";

// Variant B — "Document cards": API box under the intro, then one card per
// document in the site's section rhythm.

const EthicsList = () => (
  <div className="border-ink mt-6 border-t-2 pt-5">
    <h4 className="font-display text-display-sm text-ink font-bold italic">
      {ETHICS.title}
    </h4>
    <p className="text-body-sm text-ink mt-2">{ETHICS.lead}</p>
    <ul className="text-body-sm text-ink mt-3 grid list-disc gap-x-8 gap-y-1.5 pl-5 md:grid-cols-2">
      {ETHICS.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <p className="text-body-sm text-ink-muted mt-4">{ETHICS.after}</p>
  </div>
);

const DocCard = ({
  doc,
  showCode,
}: {
  doc: PrototypeDoc;
  showCode: boolean;
}) => {
  const withCode = showCode && doc.slug === ETHICS_AFTER_SLUG;
  return (
    <TapedCard
      as="li"
      rotation="none"
      shadow="md"
      padding="md"
      className={cn("flex flex-col", withCode && "md:col-span-2")}
    >
      <MonoLabel variant="pill-jersey-deep" size="sm">
        {doc.forWho}
      </MonoLabel>
      <EditorialHeading level={3} size="display-sm" className="mt-3">
        {doc.title}
      </EditorialHeading>
      <p className="text-body-sm text-ink mt-2">
        <Rich parts={doc.intro} />
      </p>
      {withCode ? <EthicsList /> : null}
      <div className="border-ink/20 mt-auto flex items-center justify-between gap-4 border-t pt-4">
        <MonoLabel tone="muted">PDF · {pagesLabel(doc.pages)}</MonoLabel>
        <PdfButton doc={doc} />
      </div>
    </TapedCard>
  );
};

export const VariantBPrototype = ({
  showCode,
  closing,
}: {
  showCode: boolean;
  closing: Closing;
}) => (
  <>
    <PageContainer className="py-12 sm:py-16">
      <div className="max-w-[var(--container-prose)]">
        <p className="text-body-lg text-ink">
          <Rich parts={INTRO_LEAD} />
        </p>
      </div>

      <aside
        aria-label="Aanspreekpunt Integriteit"
        className="bg-jersey-deep-dark text-cream border-ink shadow-paper-md mt-8 flex flex-col gap-4 border-2 p-6 sm:flex-row sm:items-start sm:p-8"
      >
        <ShieldCheck size={40} aria-hidden="true" className="shrink-0" />
        <div className="[&_.prose-link]:text-cream! flex flex-col gap-3">
          <p className="font-display text-display-sm font-bold italic">
            <Rich parts={INTRO_SAFE} />
          </p>
          <p className="text-body-md">
            <Rich parts={API_LINE} />
          </p>
        </div>
      </aside>

      <p className="text-body-md text-ink mt-10 max-w-[var(--container-prose)]">
        <Rich parts={INTRO_INDEX} />
      </p>

      {GROUPS.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`b-${group.id}`}
          className="mt-14"
        >
          <SectionHeader id={`b-${group.id}`} title={group.title} />
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {group.docs.map((doc) => (
              <DocCard key={doc.slug} doc={doc} showCode={showCode} />
            ))}
          </ul>
        </section>
      ))}
    </PageContainer>
    <PrototypeClosing closing={closing} />
  </>
);
