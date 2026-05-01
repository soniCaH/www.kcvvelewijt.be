/**
 * AlertBadge Component Stories
 *
 * Direction E ("Angled badge + italic Freight Display message") locked at
 * the Phase 2.A.5 design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-a-5-alert/option-e-angled-badge.html
 * and PRD §6.4.A.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertBadge } from "./AlertBadge";

const meta = {
  title: "UI/AlertBadge",
  component: AlertBadge,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Primary inline alert. Angled colour-filled badge on the left + italic Freight Display message on the right. Non-dismissible by design — used for inline form-field validation, short single-headline confirmations, and form summaries (one badge under the form with a multi-line message). For long-form alerts with a title, multi-paragraph body, or dismiss button, use the sibling `<Alert>` ticket-stub component.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  args: {
    // Meta-level defaults so `StoryObj<typeof meta>` doesn't force every
    // `render`-only story to re-state `variant` + `children`. Stories
    // override via their own `args` block.
    variant: "success",
    children: "Bericht verzonden.",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "warning", "error"],
    },
  },
} satisfies Meta<typeof AlertBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: "success",
    children: "Bericht verzonden.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Wedstrijd kan uitgesteld worden.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    children: "Geen geldig telefoonnummer.",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <AlertBadge variant="success">Bericht verzonden.</AlertBadge>
      <AlertBadge variant="warning">
        Wedstrijd kan uitgesteld worden.
      </AlertBadge>
      <AlertBadge variant="error">Geen geldig telefoonnummer.</AlertBadge>
    </div>
  ),
};

/**
 * Multi-line message — wrapped lines align to the same x-edge as line 1
 * (badge-right + gap). Badge stays anchored to line 1 via `items-start`.
 */
export const MultiLineMessage: Story = {
  render: () => (
    <AlertBadge variant="success">
      Je bericht is verzonden — we nemen binnen 2 werkdagen contact met je op.
    </AlertBadge>
  ),
};

/**
 * Form-context — error appears inline under a failing input.
 */
export const InFormContext: Story = {
  render: () => (
    <form className="flex max-w-md flex-col gap-2" noValidate>
      <label
        htmlFor="phone"
        className="text-ink font-mono text-sm tracking-wider uppercase"
      >
        Telefoonnummer
      </label>
      <input
        id="phone"
        type="tel"
        defaultValue="abc"
        aria-invalid="true"
        aria-describedby="phone-error"
        className="border-alert text-ink rounded-none border-2 bg-white px-3 py-2"
      />
      <div id="phone-error">
        <AlertBadge variant="error">Geen geldig telefoonnummer.</AlertBadge>
      </div>
    </form>
  ),
};

/**
 * Form-summary — one badge under the form with a multi-line summary
 * listing several issues.
 */
export const FormSummary: Story = {
  render: () => (
    <AlertBadge variant="error">
      Drie velden zijn nog niet ingevuld of bevatten ongeldige gegevens.
      Controleer naam, telefoonnummer en geboortedatum.
    </AlertBadge>
  ),
};

export const SmallInlineFormRow: Story = {
  render: () => (
    <AlertBadge variant="error" size="sm">
      Geen geldig telefoonnummer.
    </AlertBadge>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`size="sm"` — used inline under Input/Select/Textarea on their helper row. Smaller pill (1.5px border, no rotation, 11px label) and 15px italic message keep the alert moment proportional to a single field rather than a full form summary.',
      },
    },
  },
};

export const SmallSizeAllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AlertBadge variant="error" size="sm">
        Geen geldig telefoonnummer.
      </AlertBadge>
      <AlertBadge variant="warning" size="sm">
        Deze keuze is niet meer aanpasbaar na verzenden.
      </AlertBadge>
      <AlertBadge variant="success" size="sm">
        Bevestigingsmail verstuurd.
      </AlertBadge>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    variant: "success",
    children: "Je bericht is verzonden.",
  },
};
