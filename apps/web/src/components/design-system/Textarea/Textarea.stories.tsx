/**
 * Textarea Component Stories — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./Textarea";
import { Label } from "../Label";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Phase 2.A.4 form atom (Direction C — paper-card emphasis). Shares the same eight-state field machine as Input/Select. When `value` is controlled and `maxLength` is set, a `<TextareaCounter>` is rendered in the bottom-right corner — text-alert when `current > max`.",
      },
    },
  },
  tags: ["autodocs", "vr"],
  argTypes: {
    resize: { control: "select", options: ["none", "vertical", "both"] },
    error: { control: "text" },
    hint: { control: "text" },
    disabled: { control: "boolean" },
    rows: { control: "number" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Schrijf hier je bericht...", rows: 4 },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "Beste KCVV,\n\nIk zou graag meer informatie ontvangen over de jeugdwerking.",
    rows: 5,
  },
};

export const Focused: Story = {
  args: {
    placeholder: "Schrijf hier je bericht...",
    rows: 4,
    autoFocus: true,
  },
};

export const FilledFocused: Story = {
  args: {
    defaultValue:
      "Beste KCVV,\n\nIk zou graag meer informatie ontvangen over de jeugdwerking.",
    rows: 5,
    autoFocus: true,
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Bericht",
    error: "Dit veld is verplicht.",
    rows: 4,
  },
};

export const ErrorFocused: Story = {
  args: {
    placeholder: "Bericht",
    error: "Dit veld is verplicht.",
    rows: 4,
    autoFocus: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "Dit veld kan niet worden aangepast.",
    disabled: true,
    rows: 3,
  },
};

export const WithHint: Story = {
  args: {
    placeholder: "Omschrijf je vraag...",
    hint: "Maximaal 500 tekens.",
    rows: 4,
  },
};

export const NoResize: Story = {
  args: {
    placeholder: "Vaste hoogte, niet versleepbaar",
    resize: "none",
    rows: 4,
  },
};

export const WithCounterUnderLimit: Story = {
  render: () => {
    const [v, setV] = useState(
      "Een korte boodschap voor het bestuur — niet meer dan een paar zinnen.",
    );
    return (
      <Textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={240}
        rows={4}
      />
    );
  },
};

export const WithCounterOverLimit: Story = {
  render: () => {
    const [v, setV] = useState(
      "Deze tekst is bewust langer dan toegestaan zodat de teller naar text-alert overschakelt en de over-limit toestand visueel zichtbaar is in de baseline-snapshot. Dit zou normaal niet kunnen via toetsenbordinvoer (maxLength blokkeert dat), maar de parent kan een te lange waarde forceren — bijvoorbeeld vanuit een opgeslagen concept dat de limiet ondertussen overschreed.",
    );
    return (
      <Textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={120}
        rows={5}
      />
    );
  },
};

export const StateMachine: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-x-6 gap-y-5">
      <div>
        <Label>Default</Label>
        <Textarea placeholder="Schrijf hier je bericht..." rows={3} />
      </div>
      <div>
        <Label>Filled</Label>
        <Textarea defaultValue="Een korte notitie." rows={3} />
      </div>
      <div>
        <Label>Error</Label>
        <Textarea
          placeholder="Bericht"
          error="Dit veld is verplicht."
          rows={3}
        />
      </div>
      <div>
        <Label>Disabled</Label>
        <Textarea defaultValue="Niet bewerkbaar" disabled rows={3} />
      </div>
    </div>
  ),
};

export const WithLabelAndKicker: Story = {
  render: () => (
    <div className="w-96">
      <Label htmlFor="msg" required>
        Bericht
      </Label>
      <Textarea
        id="msg"
        placeholder="Schrijf hier je bericht..."
        hint="Houd het kort en bondig — maximaal 240 tekens."
        rows={5}
      />
      <p className="text-ink/60 mt-2 font-mono text-[11px] tracking-wide uppercase">
        Van bestuur ontvangen · 12 apr 2026
      </p>
    </div>
  ),
};
