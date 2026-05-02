import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClippedCard } from "./ClippedCard";
import { TapedCard } from "../TapedCard";

const meta = {
  title: "UI/ClippedCard",
  component: ClippedCard,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  args: {
    children: null,
  },
  decorators: [
    (Story) => (
      <div className="bg-cream inline-block p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClippedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <ClippedCard>
      <div className="font-display max-w-[420px]">
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase opacity-70">
          Archief · 1909
        </p>
        <h3 className="text-display-sm mt-1">Het document.</h3>
        <p className="text-body-sm mt-3 leading-relaxed">
          Een geclipte papiersfeer — bordered, geen schaduw, geen rotatie.
          Bedoeld voor formulieren, officiële mededelingen en archiefkaarten.
        </p>
      </div>
    </ClippedCard>
  ),
};

export const RegistrationFormShell: Story = {
  render: () => (
    <ClippedCard className="w-[640px] max-w-full">
      <div className="text-ink-muted border-paper-edge mb-5 flex items-center justify-between border-b pb-2 font-mono text-[11px] tracking-[0.08em] uppercase">
        <span>Inschrijfformulier</span>
        <span>Veld 5 / 7</span>
      </div>
      <h2 className="font-display mb-6 text-[40px] leading-[1.05] font-black">
        Welkom op de tribune.
      </h2>
      <div className="grid grid-cols-2 gap-x-5 gap-y-[18px]">
        <PreviewField label="Voornaam" value="Lieve" />
        <PreviewField label="Achternaam" placeholder="Bv. Janssens" />
        <PreviewField label="E-mail" placeholder="naam@voorbeeld.be" />
        <PreviewField label="Telefoon" value="+32 470" error />
        <PreviewField label="Geboortejaar" value="1992" optional />
        <PreviewField label="Ploeg" value="A-ploeg" />
        <PreviewField
          label="Vertel iets"
          value="Al jaren supporter via mijn nonkel."
          span2
          optional
        />
      </div>
      <div className="border-paper-edge mt-6 flex items-center justify-between border-t border-dashed pt-4">
        <span className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
          5 van 7 ingevuld
        </span>
        <span className="border-ink bg-cream-soft inline-flex items-center gap-2 border-2 px-4 py-2 font-mono text-[12px] tracking-[0.08em] uppercase shadow-[4px_4px_0_0_var(--color-ink)]">
          Versturen <span aria-hidden>→</span>
        </span>
      </div>
    </ClippedCard>
  ),
};

/**
 * Anti-pattern story — illustrates the visual conflict ClippedCard
 * exists to prevent. Do **not** combine corner-clips with TapedCard's
 * rotation + offset shadow + tape vocabulary. This story is here so
 * reviewers see what *not* to build.
 */
export const DontMixWithTapedCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "❌ Anti-pattern. ClippedCard and TapedCard express different moods (archival vs. casual notice). Their prop surfaces are deliberately non-overlapping — corner-clips on a rotated, shadowed, taped card violates the master design.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-2 items-start gap-12">
      <div>
        <p className="text-ink-muted mb-3 font-mono text-[11px] tracking-[0.08em] uppercase">
          ✓ Correct — ClippedCard
        </p>
        <ClippedCard className="w-[260px]">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
            archief / formulier
          </p>
          <p className="text-body-sm mt-2">Bordered + corner-clips + flat.</p>
        </ClippedCard>
      </div>
      <div>
        <p className="text-ink-muted mb-3 font-mono text-[11px] tracking-[0.08em] uppercase">
          ✓ Correct — TapedCard
        </p>
        <TapedCard rotation="b" tape={{ color: "jersey", length: "md" }}>
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase">
            losse mededeling
          </p>
          <p className="text-body-sm mt-2">Rotated + shadow + tape.</p>
        </TapedCard>
      </div>
    </div>
  ),
};

interface PreviewFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  optional?: boolean;
  error?: boolean;
  span2?: boolean;
}

function PreviewField({
  label,
  value,
  placeholder,
  optional,
  error,
  span2,
}: PreviewFieldProps) {
  return (
    <label className={span2 ? "col-span-2 block" : "block"}>
      <span className="mb-1 flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase">
        {label}
        {optional && (
          <span className="border-paper-edge bg-cream-soft inline-block rounded-full border px-2 py-[1px] text-[9px] tracking-[0.06em] normal-case opacity-70">
            optioneel
          </span>
        )}
      </span>
      <span
        className={
          "block w-full border bg-white px-3 py-2 font-mono text-[13px] " +
          (error
            ? "border-alert text-alert"
            : value
              ? "border-ink/60 text-ink"
              : "border-ink/30 text-ink-muted")
        }
      >
        {value ?? placeholder ?? " "}
      </span>
    </label>
  );
}
