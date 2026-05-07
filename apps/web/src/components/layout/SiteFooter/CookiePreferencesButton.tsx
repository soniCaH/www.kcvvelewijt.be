"use client";

import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentReady } from "../CookieConsentBanner/CookieConsentBanner";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (cookieConsentReady) {
          CookieConsent.showPreferences();
        }
      }}
      className="text-cream/85 hover:text-cream inline-flex h-6 cursor-pointer items-center border-0 bg-transparent p-0 font-mono text-[9.5px] font-medium tracking-[0.06em] uppercase transition-colors md:text-[10.5px]"
    >
      Cookie-instellingen
    </button>
  );
}
