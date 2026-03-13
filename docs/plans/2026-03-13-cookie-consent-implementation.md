# Cookie Consent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GDPR-compliant cookie consent banner using `vanilla-cookieconsent`, storing preferences in localStorage, gating analytics for #685.

**Architecture:** A `"use client"` `CookieConsentBanner` component calls `CookieConsent.run()` on mount and is mounted once in the root layout. The library manages its own DOM (banner + preferences modal). A "Cookie-instellingen" button in the footer lets users reopen the modal.

**Tech Stack:** `vanilla-cookieconsent` (npm), Next.js `"use client"`, Vitest + Testing Library, Tailwind CSS v4 (CSS variable overrides only)

---

### Task 1: Install `vanilla-cookieconsent`

**Files:**

- Modify: `apps/web/package.json` (via pnpm)

**Step 1: Install the package**

```bash
pnpm --filter @kcvv/web add vanilla-cookieconsent
```

**Step 2: Verify it installed**

```bash
ls apps/web/node_modules/vanilla-cookieconsent/dist/
```

Expected: `cmp.umd.js`, `cookieconsent.css`, etc.

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "deps(ui): add vanilla-cookieconsent"
```

---

### Task 2: Create `CookieConsentBanner` component

**Files:**

- Create: `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.tsx`
- Create: `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.test.tsx`
- Create: `apps/web/src/components/layout/CookieConsentBanner/index.ts`

**Step 1: Write the failing test**

Create `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockRun = vi.fn();

vi.mock("vanilla-cookieconsent", () => ({
  run: mockRun,
}));

// Import after mock is set up
const { CookieConsentBanner } = await import("./CookieConsentBanner");

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    mockRun.mockClear();
  });

  it("calls CookieConsent.run on mount", () => {
    render(<CookieConsentBanner />);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("passes a config object with nl language and two categories", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.language.default).toBe("nl");
    expect(config.categories.necessary).toBeDefined();
    expect(config.categories.analytics).toBeDefined();
  });

  it("renders nothing visible", () => {
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/web test CookieConsentBanner --run
```

Expected: FAIL — `CookieConsentBanner` not found.

**Step 3: Create the component**

Create `apps/web/src/components/layout/CookieConsentBanner/CookieConsentBanner.tsx`:

```typescript
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
```

**Step 4: Create barrel**

Create `apps/web/src/components/layout/CookieConsentBanner/index.ts`:

```typescript
export { CookieConsentBanner } from "./CookieConsentBanner";
```

**Step 5: Run test to verify it passes**

```bash
pnpm --filter @kcvv/web test CookieConsentBanner --run
```

Expected: PASS — 3 tests passing.

**Step 6: Commit**

```bash
git add apps/web/src/components/layout/CookieConsentBanner/
git commit -m "feat(ui): add CookieConsentBanner component with vanilla-cookieconsent"
```

---

### Task 3: Export from layout barrel + mount in root layout

**Files:**

- Modify: `apps/web/src/components/layout/index.ts`
- Modify: `apps/web/src/app/layout.tsx`

**Step 1: Add to layout barrel**

In `apps/web/src/components/layout/index.ts`, append after the `PageFooter` export:

```typescript
// CookieConsentBanner
export { CookieConsentBanner } from "./CookieConsentBanner";
```

**Step 2: Mount in root layout**

In `apps/web/src/app/layout.tsx`, add the import at the top (with existing layout imports):

```typescript
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
```

Then inside `<body>`, add `<CookieConsentBanner />` after `<PageFooter />`:

```tsx
<body suppressHydrationWarning>
  <PageHeader youthTeams={youthTeams} seniorTeams={seniorTeams} />
  {children}
  <PageFooter />
  <CookieConsentBanner />
</body>
```

**Step 3: Type-check**

```bash
pnpm --filter @kcvv/web type-check
```

Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/components/layout/index.ts apps/web/src/app/layout.tsx
git commit -m "feat(ui): mount CookieConsentBanner in root layout"
```

---

### Task 4: Add "Cookie-instellingen" link to footer

**Files:**

- Modify: `apps/web/src/components/layout/PageFooter/PageFooter.tsx`
- Modify: `apps/web/src/components/layout/PageFooter/PageFooter.test.tsx`

**Step 1: Write the failing test**

In `PageFooter.test.tsx`, add a new test inside the `describe("PageFooter")` block:

```typescript
it("renders cookie preferences button", () => {
  render(<PageFooter />);
  const btn = screen.getByRole("button", { name: /cookie-instellingen/i });
  expect(btn).toBeInTheDocument();
});
```

Also update the existing `"renders all 8 contact rows"` test — it will become 9 rows. Change `"renders all 8 contact rows"` to `"renders all 9 contact rows"` and add:

```typescript
expect(screen.getByText("Cookie-instellingen")).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

```bash
pnpm --filter @kcvv/web test PageFooter --run
```

Expected: FAIL — button not found.

**Step 3: Add the cookie preferences button to the footer**

`PageFooter.tsx` is a server component and must remain so. Create a small isolated client component `CookiePreferencesButton.tsx` alongside the footer:

```typescript
// apps/web/src/components/layout/PageFooter/CookiePreferencesButton.tsx
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
```

Then in `PageFooter.tsx`, import and render `CookiePreferencesButton` in the `contactRows` array after the existing `"Privacy & cookies"` row — no `"use client"` directive or `vanilla-cookieconsent` import needed in the footer itself:

```typescript
import { CookiePreferencesButton } from "./CookiePreferencesButton";

// inside contactRows:
{
  label: "Cookie-instellingen",
  value: <CookiePreferencesButton />,
},
```

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @kcvv/web test PageFooter --run
```

Expected: PASS — all tests passing.

**Step 5: Commit**

```bash
git add apps/web/src/components/layout/PageFooter/PageFooter.tsx apps/web/src/components/layout/PageFooter/PageFooter.test.tsx
git commit -m "feat(ui): add cookie preferences button to footer"
```

---

### Task 5: Theme `vanilla-cookieconsent` with KCVV green

**Files:**

- Modify: `apps/web/src/app/globals.css`

**Step 1: Add CSS variable overrides**

Append to the end of `apps/web/src/app/globals.css`:

```css
/* ===== vanilla-cookieconsent Theme Overrides ===== */
:root {
  --cc-btn-primary-bg: #4acf52;
  --cc-btn-primary-hover-bg: #3ab543;
  --cc-btn-primary-border-color: #4acf52;
  --cc-btn-primary-hover-border-color: #3ab543;
  --cc-toggle-on-bg: #4acf52;
  --cc-toggle-on-knob-bg: #fff;
  --cc-separator-border-color: rgba(74, 207, 82, 0.15);
}
```

**Step 2: Run full check**

```bash
pnpm --filter @kcvv/web check-all
```

Expected: lint, type-check, and tests all pass.

**Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(ui): theme cookie consent banner with KCVV green"
```

---

### Task 6: Final verification

**Step 1: Run all web tests**

```bash
pnpm --filter @kcvv/web test --run
```

Expected: all tests pass.

**Step 2: Build check**

```bash
pnpm turbo build --filter=@kcvv/web
```

Expected: build succeeds, no type errors.

**Step 3: Push branch**

Create a dedicated feature branch for this work and push it:

```bash
git checkout -b feat/cookie-consent
git push -u origin feat/cookie-consent
```
