import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { DartsSignupForm } from "@/components/darts/DartsSignup/DartsSignup";

/**
 * EK Darts signup form for `/darts` (#3812): the intro line reads the spots
 * left, the fields are the five the issue lists plus two checkboxes and an
 * optional remark. The BFF decides spot or wachtlijst at submit time; the form
 * only shows the matching confirmation.
 *
 * The component reads `/api/darts/spots` on mount and posts to `/api/darts`,
 * so every story routes `fetch` through `stubBackend` to stay deterministic
 * for VR.
 */
const meta: Meta<typeof DartsSignupForm> = {
  title: "Features/Forms/DartsSignupForm",
  component: DartsSignupForm,
  tags: ["autodocs", "vr"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-cream w-[760px] max-w-full p-12">
        <Story />
      </div>
    ),
  ],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Swap `fetch`: the spots read answers `spotsLeft`, the signup POST `submit`. */
const stubBackend = (opts: {
  spotsLeft: number;
  submit?: () => Promise<Response>;
}) => {
  const original = globalThis.fetch;
  globalThis.fetch = ((url: RequestInfo | URL) =>
    String(url).endsWith("/api/darts/spots")
      ? Promise.resolve(json({ spotsLeft: opts.spotsLeft }))
      : (opts.submit?.() ??
        Promise.resolve(json({ ok: true, waitlist: false })))) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
};

/** Fill every required field, tick both boxes and press submit. */
const fillAndSubmit = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText(/Ploegnaam/), "De Pijlenjagers");
  await userEvent.type(canvas.getByLabelText(/Naam kapitein/), "Jan Peeters");
  await userEvent.type(canvas.getByLabelText(/Gsm kapitein/), "0470 12 34 56");
  await userEvent.type(
    canvas.getByLabelText(/E-mail kapitein/),
    "jan@example.com",
  );
  await userEvent.click(canvas.getByLabelText(/Ik ken het reglement/));
  await userEvent.click(canvas.getByLabelText(/pas definitief/));
  await userEvent.click(canvas.getByText("Schrijf onze ploeg in"));
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Spots left — the intro counts them. */
export const Default: Story = {
  beforeEach: () => stubBackend({ spotsLeft: 9 }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(
      "Schrijf je ploeg in. Nog 9 van de 24 plaatsen vrij.",
    );
  },
};

/** All 24 spots taken — the intro offers the wachtlijst instead. */
export const WachtlijstIntro: Story = {
  beforeEach: () => stubBackend({ spotsLeft: 0 }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(/Alle 24 plaatsen zijn ingenomen/);
  },
};

/** The request is in flight — the button swaps its label for the dots; the `fetch` never settles. */
export const Submitting: Story = {
  beforeEach: () =>
    stubBackend({ spotsLeft: 9, submit: () => new Promise(() => {}) }),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByRole("button", { name: "Versturen…" });
  },
};

/** The team got a spot — the confirmation replaces the form and takes focus. */
export const Success: Story = {
  beforeEach: () => stubBackend({ spotsLeft: 9 }),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByText(/Ingeschreven!/);
  },
};

/** The BFF put the team on the wachtlijst. */
export const SuccessWachtlijst: Story = {
  beforeEach: () =>
    stubBackend({
      spotsLeft: 0,
      submit: () => Promise.resolve(json({ ok: true, waitlist: true })),
    }),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByText(/Jullie staan op de wachtlijst/);
  },
};

/** The BFF refuses the signup — its own message sits under the fields. */
export const ServerError: Story = {
  beforeEach: () =>
    stubBackend({
      spotsLeft: 9,
      submit: () =>
        Promise.resolve(
          json(
            {
              error:
                "Verificatie mislukt. Vernieuw de pagina en probeer opnieuw.",
            },
            400,
          ),
        ),
    }),
  play: async ({ canvasElement }) => {
    await fillAndSubmit(canvasElement);
    await within(canvasElement).findByRole("alert");
  },
};
