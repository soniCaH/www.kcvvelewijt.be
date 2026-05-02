import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  Button,
  ClippedCard,
  Input,
  Label,
  Select,
  StampBadge,
  Textarea,
} from "@/components/design-system";

/**
 * Composition pattern — pairs <ClippedCard> + <StampBadge> with the
 * Phase 2.A.4 form atoms to render the locked registration-card shell
 * documented in `docs/design/mockups/phase-2-a-4-form-atoms/option-c-locked.html`.
 *
 * This is intentionally a Storybook composition rather than a promoted
 * `<FormCard>` wrapper — promote only when ≥ 2 form pages duplicate the
 * exact shell (per issue #1591 §"Composition pattern").
 *
 * <ClippedCard> here renders a <div>; the inner <form> handles submit
 * semantics. ClippedCard's prop surface is intentionally narrow (no
 * native HTML attribute pass-through) — feature-level concerns like
 * `onSubmit` belong on the form element inside.
 */
const meta = {
  title: "Features/Forms/RegistrationCardPattern",
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[760px] max-w-full p-12">
        <Story />
      </div>
    ),
  ],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface Args {
  onSubmit: (e: React.FormEvent) => void;
}

function RegistrationForm({ onSubmit }: Args) {
  return (
    <ClippedCard>
      <StampBadge tone="jersey" rotation={2} position="top-right">
        ★ INSCHRIJVING
      </StampBadge>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
      >
        <div className="text-ink-muted border-paper-edge mb-6 flex items-center justify-between border-b pb-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          <span>Inschrijfformulier · seizoen 26/27</span>
          <span>Veld 5 / 7</span>
        </div>

        <h2 className="font-display mb-6 text-[40px] leading-[1.05] font-black">
          Welkom op de tribune.
        </h2>

        <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] md:grid-cols-2">
          <div>
            <Label htmlFor="rcp-voornaam" required>
              Voornaam
            </Label>
            <Input id="rcp-voornaam" name="voornaam" defaultValue="Lieve" />
          </div>
          <div>
            <Label htmlFor="rcp-achternaam" required>
              Achternaam
            </Label>
            <Input
              id="rcp-achternaam"
              name="achternaam"
              placeholder="Bv. Janssens"
            />
          </div>
          <div>
            <Label htmlFor="rcp-email" required>
              E-mail
            </Label>
            <Input
              id="rcp-email"
              name="email"
              type="email"
              placeholder="naam@voorbeeld.be"
            />
          </div>
          <div>
            <Label htmlFor="rcp-telefoon" required>
              Telefoon
            </Label>
            <Input
              id="rcp-telefoon"
              name="telefoon"
              defaultValue="+32 470"
              error="Geef een volledig telefoonnummer."
            />
          </div>
          <div>
            <Label htmlFor="rcp-jaar" optional>
              Geboortejaar
            </Label>
            <Input
              id="rcp-jaar"
              name="jaar"
              inputMode="numeric"
              defaultValue="1992"
            />
          </div>
          <div>
            <Label htmlFor="rcp-ploeg" required>
              Ploeg
            </Label>
            <Select id="rcp-ploeg" name="ploeg" defaultValue="A">
              <option value="A">A-ploeg</option>
              <option value="B">B-ploeg</option>
              <option value="U21">U21</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="rcp-vertel" optional>
              Vertel iets
            </Label>
            <Textarea
              id="rcp-vertel"
              name="vertel"
              rows={3}
              defaultValue="Al jaren supporter via mijn nonkel."
            />
          </div>
        </div>

        <div className="border-paper-edge mt-7 flex items-center justify-between border-t border-dashed pt-4">
          <span className="text-ink-muted font-mono text-[11px] tracking-[0.08em] uppercase">
            5 van 7 ingevuld
          </span>
          <Button variant="secondary" withArrow type="submit">
            Versturen
          </Button>
        </div>
      </form>
    </ClippedCard>
  );
}

export const Default: Story = {
  render: (args) => <RegistrationForm onSubmit={(args as Args).onSubmit} />,
};
