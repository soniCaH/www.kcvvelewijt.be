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
      className="text-cream/70 hover:text-cream cursor-pointer border-0 bg-transparent p-0 font-mono text-[10.5px] tracking-[0.08em] uppercase transition-colors"
    >
      Cookie-instellingen
    </button>
  );
}
