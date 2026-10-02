import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { MembershipForm } from "@/components/club/MembershipForm/MembershipForm";
import {
  DRAFT_STORAGE_KEY,
  EMPTY_DRAFT,
} from "@/components/club/MembershipForm/membership-draft";

/**
 * Membership-intake form for `/club/word-lid`, built from the locked Phase 2.A.4
 * form atoms inside a <ClippedCard> + <StampBadge> shell. Role selector reveals
 * role-specific fields; a minor birth date reveals the parent-consent block.
 *
 * `defaultRole` / `defaultBirthDate` exist only to render the conditional
 * branches statically for docs + visual regression — the live form starts empty.
 *
 * Every story starts from an empty `sessionStorage` and leaves it empty: the
 * form keeps a per-tab draft (#3326), so one story's typing must not restore
 * into the next.
 */
const meta: Meta<typeof MembershipForm> = {
  title: "Features/Forms/MembershipForm",
  component: MembershipForm,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  beforeEach: () => {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return () => window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[760px] max-w-full p-12">
        <Story />
      </div>
    ),
  ],
};

/** Swap `fetch` for `impl`; the returned cleanup puts the original back. */
function stubFetch(impl: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = original;
  };
}

/** Fill the required fields and press submit — shared by the submit-state stories. */
async function fillAndSubmit(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText(/Voornaam/), "Jan");
  await userEvent.type(canvas.getByLabelText(/Achternaam/), "Peeters");
  await userEvent.type(canvas.getByLabelText(/Geboortedatum/), "1990-06-15");
  await userEvent.selectOptions(canvas.getByLabelText(/Geslacht/), "m");
  await userEvent.type(canvas.getByLabelText(/Gemeente/), "Elewijt");
  await userEvent.type(canvas.getByLabelText(/^E-mail/), "jan@example.com");
  await userEvent.click(canvas.getByLabelText(/privacyverklaring/i));
  await userEvent.click(canvas.getByText(/Verstuur aanvraag/));
}

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty form — base fields, no role selected yet. */
export const Default: Story = {};

/** Senior player — reveals the medical-certificate acknowledgment. */
export const Speler: Story = {
  args: { defaultRole: "speler" },
};

/** Volunteer — base fields only, no medical cert. */
export const Vrijwilliger: Story = {
  args: { defaultRole: "vrijwilliger" },
};

/** Minor youth player — medical cert + parent-consent block both visible. */
export const MinderjarigeJeugdspeler: Story = {
  args: { defaultRole: "jeugdspeler", defaultBirthDate: "2014-05-01" },
};

/**
 * The transport `fetch` rejects (#2580) — a Tier 2 `<EmptyState>` notice, no
 * action (the submit button below it already survives). Forcing the
 * rejection via `beforeEach` keeps this deterministic for VR.
 */
export const TransportFailure: Story = {
  args: { defaultRole: "vrijwilliger" },
  beforeEach: () => stubFetch(() => Promise.reject(new Error("Network error"))),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByRole("alert");
  },
};

/**
 * The request is in flight (#3384) — the submit button swaps its label for the
 * compact dots, stays disabled and keeps its width. The `fetch` never settles,
 * so the frame is stable for VR.
 */
export const Submitting: Story = {
  args: { defaultRole: "vrijwilliger" },
  beforeEach: () => stubFetch(() => new Promise(() => {})),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByRole("button", { name: "Versturen…" });
  },
};

/**
 * The request succeeded (#3384) — the confirmation card replaces the form and
 * its heading takes focus.
 */
export const Success: Story = {
  args: { defaultRole: "vrijwilliger" },
  beforeEach: () =>
    stubFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByRole("heading", {
      name: "Bedankt voor je interesse!",
    });
  },
};

/**
 * A visitor comes back to a half-filled application (#3326) — the draft is
 * restored, one line above the first field says so, and **Wis formulier**
 * empties it. The draft beats `defaultRole`, so the volunteer role below is
 * ignored.
 */
export const RestoredDraft: Story = {
  // Seeds the shared `sessionStorage`; the docs page would show every other
  // story's form restored from it.
  tags: ["!autodocs"],
  args: { defaultRole: "vrijwilliger" },
  beforeEach: () => {
    window.sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        ...EMPTY_DRAFT,
        role: "speler",
        firstName: "Jan",
        lastName: "Peeters",
        birthDate: "1990-06-15",
        gender: "m",
        municipality: "Elewijt",
        email: "jan@example.com",
        medicalCertAcknowledged: true,
      }),
    );
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(
      "We hebben je ingevulde gegevens bewaard.",
    );
  },
};
