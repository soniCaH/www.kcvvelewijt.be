# Cookie Consent Design

**Issue:** #686
**Date:** 2026-03-13
**Status:** Approved

## Goal

Add GDPR-compliant cookie consent to the KCVV Elewijt website using `vanilla-cookieconsent`. Stores user preferences locally (no third-party service). Prerequisite for enabling analytics (#685).

## Chosen Approach

`vanilla-cookieconsent` npm package — self-hosted, TypeScript-first, no account or API key required. Manages consent state in `localStorage` (`cc_cookie`). Handles banner UI, preferences modal, revision management, and granular category toggling out of the box.

## Architecture

A single `CookieConsentBanner` client component initialises `vanilla-cookieconsent` on mount via `useEffect`. Mounted once in the root layout alongside `PageHeader` and `PageFooter`. No React context needed — `vanilla-cookieconsent` exposes its API globally via `CookieConsent.*`.

## Files

| File                                                                              | Change                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.tsx`      | New — `"use client"`, calls `CookieConsent.run(config)` on mount         |
| `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.test.tsx` | New — unit test                                                          |
| `apps/web/src/components/layout/CookieConsentBanner/index.ts`                     | New — barrel export                                                      |
| `apps/web/src/components/layout/index.ts`                                         | Add `CookieConsentBanner` export                                         |
| `apps/web/src/app/layout.tsx`                                                     | Add `<CookieConsentBanner />` inside `<body>`                            |
| `apps/web/src/components/layout/PageFooter/PageFooter.tsx`                        | Add "Cookie-instellingen" link calling `CookieConsent.showPreferences()` |
| `apps/web/src/components/layout/PageFooter/PageFooter.test.tsx`                   | Update — assert link is present                                          |
| `apps/web/src/app/globals.css`                                                    | Add CSS variable overrides for KCVV green theme                          |

No new route needed — `/privacy` page already exists and covers the privacy statement.

## Consent Categories

| Category    | Default      | Description                                         |
| ----------- | ------------ | --------------------------------------------------- |
| `necessary` | Always on    | Basic site functionality, no toggle                 |
| `analytics` | Off (opt-in) | Anonymous visitor stats — gates GTM when #685 lands |

## Config Details

- Language: `nl` (Dutch)
- Banner text: _"Wij gebruiken cookies om de website correct te laten werken en om anonieme bezoekersstatistieken bij te houden. Lees onze [privacyverklaring](/privacy)."_
- Buttons: **Alles accepteren** / **Beheer voorkeuren**
- Preferences modal: per-category toggles + **Sla op** button
- GTM consent mode stub: `window.dataLayer.push({ event: 'cookie_consent_update', analytics_storage: ... })` — wired fully in #685

## Styling

Override `vanilla-cookieconsent` CSS custom properties in `globals.css`:

```css
--cc-btn-primary-bg: #4acf52;
--cc-btn-primary-hover-bg: #3ab543;
--cc-toggle-on-bg: #4acf52;
```

Font stack inherits from existing site globals.

## Testing

- `CookieConsentBanner`: mock `vanilla-cookieconsent`, assert `CookieConsent.run` called on mount
- `PageFooter`: assert "Cookie-instellingen" link/button is present in the rendered output

## Not In Scope

- Storybook story — component has no JSX output; visual output is DOM-injected by the library
- Custom cookie page — `/privacy` already covers cookie policy
- Full GTM integration — deferred to #685
