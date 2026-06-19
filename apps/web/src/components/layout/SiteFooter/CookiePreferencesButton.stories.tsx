import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CookieConsentBanner } from "../CookieConsentBanner/CookieConsentBanner";
import { CookiePreferencesButton } from "./CookiePreferencesButton";

/**
 * `<CookiePreferencesButton>` is the footer link that re-opens the
 * vanilla-cookieconsent preferences modal. It takes no props: its click
 * handler guards on the module-level `cookieConsentReady` flag exported by
 * `<CookieConsentBanner>`, which only flips to `true` once `CookieConsent.run()`
 * has resolved. Until then the button renders identically but the click is a
 * no-op (it cannot show preferences for a consent system that has not booted).
 *
 * The two states below are therefore behaviourally distinct but visually
 * identical — the rendered markup never changes, only whether the click fires
 * `CookieConsent.showPreferences()`.
 */
const meta = {
  title: "Layout/CookiePreferencesButton",
  component: CookiePreferencesButton,
  parameters: {
    // Dark footer ink background — the button text is cream-on-ink.
    backgrounds: { default: "dark" },
    docs: {
      description: {
        component:
          "Footer link that re-opens the cookie preferences modal. No props — " +
          "the click guards on the `cookieConsentReady` flag from " +
          "`<CookieConsentBanner>`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-ink p-6">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof CookiePreferencesButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ready state — `<CookieConsentBanner>` is mounted alongside the button, so
 * once `CookieConsent.run()` resolves, `cookieConsentReady` becomes `true` and
 * clicking the link opens the preferences modal.
 */
export const Default: Story = {
  name: "Default (consent ready)",
  parameters: {
    docs: {
      description: {
        story:
          "With `<CookieConsentBanner>` mounted, `cookieConsentReady` flips to " +
          "`true` after init and the click opens the preferences modal.",
      },
    },
  },
  render: () => (
    <>
      <CookieConsentBanner />
      <CookiePreferencesButton />
    </>
  ),
};

/**
 * Not-ready state — the button renders on its own without the banner, so
 * `cookieConsentReady` stays `false` and clicking is a no-op. The markup is
 * identical to the ready state; only the click behaviour differs.
 */
export const NotReady: Story = {
  name: "Not ready (consent not booted)",
  parameters: {
    docs: {
      description: {
        story:
          "Rendered without `<CookieConsentBanner>`: `cookieConsentReady` is " +
          "`false`, so the click is a guarded no-op. Visually identical to the " +
          "ready state.",
      },
    },
  },
  render: () => <CookiePreferencesButton />,
};
