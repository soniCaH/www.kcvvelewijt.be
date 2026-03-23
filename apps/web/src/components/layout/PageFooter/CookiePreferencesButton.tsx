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
      className="text-[0.6875rem] text-white/35 hover:text-white/65 transition-colors cursor-pointer bg-transparent border-0 p-0"
    >
      Cookie-instellingen
    </button>
  );
}
