// Whether CookieConsent.run() has resolved; <CookiePreferencesButton> guards showPreferences()
// on it. A plain module, not an export of the 'use client' banner, so the flag is the value
// itself and not a client reference.
export const cookieConsentState = { ready: false };
