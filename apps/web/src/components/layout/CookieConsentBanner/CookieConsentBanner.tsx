"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

export function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run({
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

      language: {
        default: "nl",
        translations: {
          nl: {
            consentModal: {
              title: "Cookies op kcvvelewijt.be",
              description:
                'Wij gebruiken cookies om de website correct te laten werken en om anonieme bezoekersstatistieken bij te houden. Lees onze <a href="/privacy">privacyverklaring</a>.',
              acceptAllBtn: "Alles accepteren",
              acceptNecessaryBtn: "Alleen noodzakelijk",
              showPreferencesBtn: "Beheer voorkeuren",
            },
            preferencesModal: {
              title: "Cookie-voorkeuren",
              acceptAllBtn: "Alles accepteren",
              acceptNecessaryBtn: "Alleen noodzakelijk",
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
    });
  }, []);

  return null;
}
