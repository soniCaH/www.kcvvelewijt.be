"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as CookieConsent from "vanilla-cookieconsent";
// Import the library CSS statically — do NOT switch to a dynamic `import()` inside the effect.
// CookieConsent.run() injects the modal and focuses its accept button synchronously; if the CSS
// has not yet resolved, the modal has no `position: fixed` and lives inline at the bottom of the
// <body>, which causes the browser to scroll-into-view to the footer on first load (issue #1313).
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { bracketAffordanceHtml } from "@/components/design-system/BracketAffordance";
import { updateConsentState } from "@/lib/analytics/gtm-consent";
import { X } from "@/lib/icons.redesign";

// Tracks whether CookieConsent.run() has resolved; used by CookiePreferencesButton
// to guard showPreferences() calls before initialization completes.
export let cookieConsentReady = false;

// D4 bracket affordance (#2620). The library assigns its label strings with
// `innerHTML`, so the mono `[×]` can ride along; the span is `aria-hidden`, so
// the button's accessible name stays the Dutch label alone.
//
// Only the dismissal carries it — "Alleen noodzakelijk" is the action the
// library's own close button fires — and it carries it in both modals, where
// it is the same action one step apart. Accept-all, save and manage-preferences
// stay bare: a bracket on every control is how punctuation turns into a second
// icon language.
const ACCEPT_NECESSARY_LABEL = `${bracketAffordanceHtml("close")} Alleen noodzakelijk`;

function syncConsentState() {
  const analyticsAccepted = CookieConsent.acceptedCategory("analytics");
  updateConsentState(analyticsAccepted);
}

export function CookieConsentBanner() {
  // The preferences modal's close button (#2675). The library draws its own
  // thin stroke X there and has no option to replace it, so the house close
  // icon — the Phosphor Fill `X` every other close on the site uses — is
  // portalled in once the modal is built. `globals.css` undoes the library's
  // `svg` styling for it.
  const [closeIconHost, setCloseIconHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    CookieConsent.run({
      // Retro reskin (#2125): corner-box banner, bottom-left. Skin only — the
      // category/consent behaviour is unchanged.
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom left",
        },
        preferencesModal: {
          layout: "box",
        },
      },

      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          readOnly: false,
        },
      },

      onConsent: syncConsentState,
      onChange: syncConsentState,
      onModalReady: ({ modalName, modal }) => {
        if (modalName !== "preferencesModal" || !isMounted) return;
        const host = modal.querySelector<HTMLElement>(".pm__close-btn span");
        if (!host) return;
        host.replaceChildren();
        setCloseIconHost(host);
      },

      language: {
        default: "nl",
        translations: {
          nl: {
            consentModal: {
              title: "Koekjes?",
              description:
                'Wij gebruiken cookies om de website correct te laten werken en om anonieme bezoekersstatistieken bij te houden. Lees onze <a href="/privacy">privacyverklaring</a>.',
              acceptAllBtn: "Alles accepteren",
              acceptNecessaryBtn: ACCEPT_NECESSARY_LABEL,
              showPreferencesBtn: "Beheer voorkeuren",
            },
            preferencesModal: {
              title: "Cookie-voorkeuren",
              acceptAllBtn: "Alles accepteren",
              acceptNecessaryBtn: ACCEPT_NECESSARY_LABEL,
              savePreferencesBtn: "Sla op",
              closeIconLabel: "Sluiten",
              sections: [
                {
                  title: "Noodzakelijke cookies",
                  description:
                    "Deze cookies zijn vereist voor de basisfunctionaliteit van de website en kunnen niet worden uitgeschakeld.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytische cookies",
                  description:
                    "Anonieme statistieken over hoe bezoekers de website gebruiken. Helpt ons de site te verbeteren.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
    })
      .then(() => {
        if (isMounted) {
          cookieConsentReady = true;
        }
      })
      .catch((error: unknown) => {
        console.error("CookieConsent initialization failed:", error);
      });

    return () => {
      isMounted = false;
      cookieConsentReady = false;
      CookieConsent.reset(false);
    };
  }, []);

  return closeIconHost
    ? createPortal(<X size={20} aria-hidden="true" />, closeIconHost)
    : null;
}
