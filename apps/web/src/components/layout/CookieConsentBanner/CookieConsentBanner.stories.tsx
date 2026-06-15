import type { CSSProperties } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { CookieConsentBanner } from "./CookieConsentBanner";

/**
 * Storybook can't render the real vanilla-cookieconsent surfaces (the library
 * is stubbed), so these are static retro replicas of the #2125 reskin — cream
 * paper, ink borders, hard offset shadow, warm tape, jersey-deep accept,
 * paper-stamp buttons, jersey-deep toggles. They mirror the live `#cc-main`
 * CSS and the locked mockup (10ck1) for visual + VR review.
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

const baseBtn: CSSProperties = {
  fontFamily: "var(--font-family-mono)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  padding: "10px 16px",
  border: "2px solid var(--color-ink)",
  cursor: "pointer",
};
const primaryBtn: CSSProperties = {
  ...baseBtn,
  background: "var(--color-jersey-deep)",
  color: "var(--color-cream)",
  boxShadow: "var(--shadow-paper-sm)",
};
const ghostBtn: CSSProperties = {
  ...baseBtn,
  background: "var(--color-cream)",
  color: "var(--color-ink)",
  boxShadow: "var(--shadow-paper-sm)",
};
const linkBtn: CSSProperties = {
  ...baseBtn,
  border: "none",
  background: "none",
  color: "var(--color-ink-muted)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  padding: "10px 4px",
};
const heading: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 900,
  lineHeight: 1,
  margin: "0 0 8px",
};

function MockBanner() {
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 420,
        maxWidth: "calc(100vw - 48px)",
        background: "var(--color-cream)",
        color: "var(--color-ink)",
        border: "2px solid var(--color-ink)",
        boxShadow: "var(--shadow-paper-md)",
        zIndex: 9999,
        fontFamily: "var(--font-family-body)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -11,
          left: 26,
          width: 88,
          height: 21,
          background: "var(--color-warm)",
          border: "2px solid var(--color-ink)",
          transform: "rotate(-3deg)",
        }}
      />
      <div style={{ padding: "24px 22px" }}>
        <h2 style={{ ...heading, fontSize: "1.5rem" }}>Koekjes?</h2>
        <p
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.55,
            color: "var(--color-ink-muted)",
            margin: "0 0 18px",
          }}
        >
          Wij gebruiken cookies om de website correct te laten werken en om
          anonieme bezoekersstatistieken bij te houden. Lees onze{" "}
          <a
            href="/privacy"
            style={{ color: "var(--color-jersey-deep)", fontWeight: 600 }}
          >
            privacyverklaring
          </a>
          .
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button style={primaryBtn}>Alles accepteren</button>
          <button style={ghostBtn}>Alleen noodzakelijk</button>
          <button style={linkBtn}>Beheer voorkeuren</button>
        </div>
      </div>
    </div>
  );
}

function MockToggle({ state }: { state: "on" | "off" | "locked" }) {
  const filled = state === "on" || state === "locked";
  return (
    <span
      aria-hidden
      style={{
        width: 42,
        height: 24,
        border: "2px solid var(--color-ink)",
        position: "relative",
        flex: "none",
        background:
          state === "on"
            ? "var(--color-jersey-deep)"
            : state === "locked"
              ? "var(--color-ink-muted)"
              : "var(--color-cream)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: filled ? 19 : 1,
          width: 18,
          height: 18,
          background: filled ? "var(--color-cream)" : "var(--color-ink)",
        }}
      />
    </span>
  );
}

function MockCategory({
  name,
  desc,
  state,
}: {
  name: string;
  desc: string;
  state: "on" | "off" | "locked";
}) {
  return (
    <div
      style={{
        border: "2px solid var(--color-ink)",
        background: "var(--color-cream-soft)",
        padding: "14px 15px",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 700 }}>{name}</span>
        <MockToggle state={state} />
      </div>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--color-ink-muted)",
          margin: "6px 0 0",
          lineHeight: 1.5,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

function MockPreferencesModal() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 10, 0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        fontFamily: "var(--font-family-body)",
      }}
    >
      <div
        role="dialog"
        aria-label="Cookie-voorkeuren"
        style={{
          width: 460,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--color-cream)",
          color: "var(--color-ink)",
          border: "2px solid var(--color-ink)",
          boxShadow: "var(--shadow-paper-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 20px",
            borderBottom: "2px solid var(--color-ink)",
          }}
        >
          <h2 style={{ ...heading, fontSize: "1.3rem", margin: 0 }}>
            Cookie-voorkeuren
          </h2>
          <span
            aria-hidden
            style={{
              fontFamily: "var(--font-family-mono)",
              fontWeight: 700,
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              border: "2px solid var(--color-ink)",
              background: "var(--color-cream)",
              boxShadow: "var(--shadow-paper-sm)",
            }}
          >
            ✕
          </span>
        </div>
        <div style={{ padding: "18px 20px", maxHeight: 320, overflow: "auto" }}>
          <MockCategory
            name="Noodzakelijke cookies"
            desc="Vereist voor de basisfunctionaliteit van de website. Altijd aan."
            state="locked"
          />
          <MockCategory
            name="Analytische cookies"
            desc="Anonieme statistieken over hoe bezoekers de website gebruiken (Google Analytics)."
            state="on"
          />
        </div>
        <div
          style={{
            padding: "16px 20px",
            borderTop: "2px solid var(--color-ink)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button style={primaryBtn}>Sla op</button>
          <button style={ghostBtn}>Alles accepteren</button>
        </div>
      </div>
    </div>
  );
}

const withBanner: Decorator = function CookieBannerDecorator(Story) {
  stubCookieConsent();
  return (
    <div>
      <Story />
      <MockBanner />
    </div>
  );
};

const withPreferences: Decorator = function CookiePreferencesDecorator(Story) {
  stubCookieConsent();
  return (
    <div>
      <Story />
      <MockPreferencesModal />
    </div>
  );
};

const withNothing: Decorator = function CookieHiddenDecorator(Story) {
  stubCookieConsent();
  return <Story />;
};

const meta = {
  title: "Layout/CookieConsentBanner",
  component: CookieConsentBanner,
  tags: ["autodocs", "vr"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CookieConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Consent banner — corner box, cream paper + ink border + hard shadow + warm tape. */
export const Banner: Story = {
  decorators: [withBanner],
};

/** Preferences modal — cream surface, cream-soft category blocks, jersey-deep toggles. */
export const Preferences: Story = {
  decorators: [withPreferences],
};

/** Hidden — after consent, the component renders nothing. */
export const Hidden: Story = {
  decorators: [withNothing],
};
