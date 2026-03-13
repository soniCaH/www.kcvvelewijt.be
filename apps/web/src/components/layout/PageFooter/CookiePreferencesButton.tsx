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
      className="text-kcvv-green-bright hover:underline cursor-pointer bg-transparent border-0 p-0 text-[0.875rem]"
    >
      Cookie-instellingen
    </button>
  );
}
