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
      className="cursor-pointer border-0 bg-transparent p-0 text-[0.6875rem] text-white/35 transition-colors hover:text-white/65"
    >
      Cookie-instellingen
    </button>
  );
}
