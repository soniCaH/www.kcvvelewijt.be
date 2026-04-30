/**
 * Alert Component Stories
 *
 * Direction B ("Ticket Stub — torn from a programme") locked at the
 * Phase 2.A.5 design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-a-5-alert/option-b-ticket-stub.html
 * and PRD §6.4.B.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert } from "./Alert";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Long-form ticket-stub alert with perforated left edge, mono caps kicker, italic Freight Display title, and ink Inter body. Used for page-level / dashboard-level alerts that need a title, multi-paragraph body, and/or a dismiss button. For inline form-field validation or short single-headline confirmations, use the sibling `<AlertBadge>` component.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "warning", "error"],
    },
    title: { control: "text" },
    dismissible: { control: "boolean" },
    onDismiss: { action: "onDismiss" },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof Alert>;

export const Success: Story = {
  args: {
    variant: "success",
    title: "Verzonden!",
    children: "Je bericht is succesvol verzonden.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Let op",
    children: "De wedstrijd kan uitgesteld worden wegens weersomstandigheden.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Fout",
    children: "Er ging iets mis. Controleer je gegevens en probeer opnieuw.",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <Alert variant="success" title="Verzonden!">
        Je bericht is succesvol verzonden.
      </Alert>
      <Alert variant="warning" title="Let op">
        De wedstrijd kan uitgesteld worden wegens weersomstandigheden.
      </Alert>
      <Alert variant="error" title="Fout">
        Er ging iets mis. Controleer je gegevens en probeer opnieuw.
      </Alert>
    </div>
  ),
};

export const WithoutTitle: Story = {
  args: {
    variant: "success",
    children: "Je bericht is succesvol verzonden.",
  },
};

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    return (
      <div className="max-w-2xl">
        {visible ? (
          <Alert
            variant="success"
            title="Nieuw seizoen"
            dismissible
            onDismiss={() => setVisible(false)}
          >
            Inschrijvingen voor het nieuwe seizoen zijn open.
          </Alert>
        ) : (
          <p className="text-ink-muted text-sm">Alert gesloten.</p>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Dismissible alert — click the × to hide it. Wire onDismiss to control visibility from outside.",
      },
    },
  },
};

/**
 * Form-success — alert renders after a contact form is submitted.
 */
export const FormSuccess: Story = {
  render: () => {
    const [visible, setVisible] = useState(true);
    return (
      <div className="max-w-2xl">
        {visible ? (
          <Alert
            variant="success"
            title="Bericht verzonden"
            dismissible
            onDismiss={() => setVisible(false)}
          >
            Bedankt voor je bericht! We nemen zo snel mogelijk contact met je
            op.
          </Alert>
        ) : (
          <p className="text-ink-muted text-sm">Bevestiging gesloten.</p>
        )}
      </div>
    );
  },
};

/**
 * Multi-paragraph body — typical page-level guidance.
 */
export const MultiParagraph: Story = {
  args: {
    variant: "warning",
    title: "Onderhoud gepland",
    children: (
      <>
        <p>
          De website is op zaterdag 3 mei tussen 22:00 en 02:00 niet beschikbaar
          wegens gepland onderhoud.
        </p>
        <p className="mt-2">
          Inschrijvingen die je voor 22:00 indient worden normaal verwerkt.
        </p>
      </>
    ),
  },
};

export const Playground: Story = {
  args: {
    variant: "success",
    title: "Titel",
    children: "Dit is de inhoud van de melding.",
    dismissible: false,
  },
};
