"use client";

import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentState } from "../CookieConsentBanner/cookieConsentState";

export const CookiePreferencesButton = () => {
  return (
    <button
      type="button"
      onClick={() => {
        if (cookieConsentState.ready) {
          CookieConsent.showPreferences();
        }
      }}
      className="text-cream-quiet hover:text-cream inline-flex h-6 cursor-pointer items-center border-0 bg-transparent p-0 font-mono text-[9.5px] font-medium tracking-[0.06em] uppercase transition-colors md:text-[10.5px]"
    >
      Cookie-instellingen
    </button>
  );
};
