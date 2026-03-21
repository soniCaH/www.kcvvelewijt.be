import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { CookieConsentBanner } from "./CookieConsentBanner";

/**
 * Stubs `window.CookieConsent` so the real library doesn't fire,
 * and optionally injects a static mock banner for the Visible story.
 */
function stubCookieConsent() {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CookieConsent = {
      run: () => Promise.resolve(),
      reset: () => {},
      showPreferences: () => {},
      acceptCategory: () => {},
      getUserPreferences: () => ({
        acceptedCategories: ["necessary"],
        rejectedCategories: ["analytics"],
      }),
    };
  }
}

function MockBanner() {
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1e2024",
        color: "#fff",
        padding: "24px",
        zIndex: 9999,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
        Cookies op kcvvelewijt.be
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: "14px", opacity: 0.85 }}>
        Wij gebruiken cookies om de website correct te laten werken en om
        anonieme bezoekersstatistieken bij te houden. Lees onze{" "}
        <a href="/privacy" style={{ color: "#4acf52" }}>
          privacyverklaring
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          style={{
            background: "#4acf52",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Alles accepteren
        </button>
        <button
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Alleen noodzakelijk
        </button>
        <button
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            border: "none",
            padding: "10px 20px",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Beheer voorkeuren
        </button>
      </div>
    </div>
  );
}

const withMockBanner = (visible: boolean): Decorator =>
  function CookieConsentDecorator(Story) {
    stubCookieConsent();
    return (
      <div>
        <Story />
        {visible && <MockBanner />}
      </div>
    );
  };

const meta = {
  title: "Layout/CookieConsentBanner",
  component: CookieConsentBanner,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CookieConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Banner visible — initial state before the user has accepted or rejected cookies
 */
export const Visible: Story = {
  decorators: [withMockBanner(true)],
};

/**
 * Banner hidden — after the user has accepted cookies, the component renders nothing
 */
export const Hidden: Story = {
  decorators: [withMockBanner(false)],
};
