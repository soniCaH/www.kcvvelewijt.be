# PRD: Email Delivery for Member-Facing Forms

**Status**: Decisions locked — implementation tracked in downstream issues
**Date**: 2026-06-02

---

## 1. Problem Statement

The site has zero email-delivery infrastructure today. `/api/feedback` proxies to the
BFF, which writes a thumbs-up/down record to Sanity (`apps/api/src/handlers/feedback.ts:11`) —
no email is ever sent.

Several deferred features depend on reliable email delivery:

- In-page membership intake form (currently external Google Forms)
- Sponsorship inquiry forms (future)
- Contact-form replacement of `mailto:` links (future)

This PRD captures the **decisions** for the email-delivery layer. No code ships from this
document; implementation issues are filed separately and `blocked-by` this spec (see
§10 — Downstream implementation issues).

## 2. Scope

**Packages touched (by downstream implementation, not this spec):** `apps/api`

**In scope (decisions only):**

- Email provider choice and region
- Verified sending domain and sender identity
- Where the API key lives
- Abuse-prevention strategy for public forms
- Persistence-before-send and user-facing failure behaviour
- Bounce/failure alerting and volume alerting
- Budget ceiling
- The as-built DNS snapshot, plus the single additive DMARC `rua` change

**Out of scope:**

- Any code (handlers, schemas, form UI, webhook handler) — filed as downstream issues
- DNS changes other than the single additive DMARC `rua` directive in §9.1
- DMARC policy tightening (`p=quarantine` / `p=reject`) — deferred to a downstream issue
  after 30 days of aggregate-report review
- Per-IP rate limiting (see §6 — not in v1)

## 3. Provider — Resend (eu-west-1)

**Resend** is the email-delivery provider. Rationale: clean DX, native Workers and Node
SDKs, EU region available.

- **Region:** `eu-west-1` (Ireland) — closest EU SES region to Belgium.
- **Free tier:** 3 000 emails/month + 100/day, comfortably above expected volume.
- Resend's sending infrastructure runs on **Amazon SES** under the hood — this matters for
  the DNS records in §9.

## 4. Verified Domain & Sender Identity

### Verified domain — `send.kcvvelewijt.be` (subdomain, not apex)

Resend was provisioned against the `send.kcvvelewijt.be` subdomain (originally set up for an
internal sponsortool). The mail-sending path reuses it **as-is** — no new Resend domain and
no DNS work for the apex.

### Sender identity

| Header     | Value                         | Purpose                                              |
| ---------- | ----------------------------- | ---------------------------------------------------- |
| `From`     | `noreply@send.kcvvelewijt.be` | Sending-only identity on the verified subdomain      |
| `Reply-To` | `info@kcvvelewijt.be`         | Genuine replies route to the existing apex catch-all |

## 5. API Key Location — Cloudflare Workers Secret

The BFF (`apps/api`) owns the email path. Next.js forms `POST` to a new BFF endpoint
(e.g. `POST /forms/membership`); the Worker calls Resend server-side.

- `RESEND_API_KEY` lives as a **Wrangler secret** on `apps/api` (production and staging set
  separately — see `apps/api/CLAUDE.md`).
- **No email secrets on Vercel.** The Next.js layer never sees the Resend key.

```bash
# Production
wrangler secret put RESEND_API_KEY
# Staging
wrangler secret put RESEND_API_KEY --env staging
```

## 6. Abuse Prevention

- **Cloudflare Turnstile** on every public form (invisible, free, native to the Worker).
- **Hidden honeypot field** as belt-and-suspenders.
- **No per-IP rate limit in v1** — add only if abuse appears.

## 7. Persistence & Fallback

- Always persist submissions to Sanity as a `formSubmission` document **before** attempting
  send. If Resend is unavailable, the inquiry is still captured and visible in Studio.
- The user-facing message is **identical on success and failure** — never leak send failures:

  ```text
  Bedankt — we hebben je bericht ontvangen.
  ```

## 8. Alerting

- **Bounce / failure alerts:** Resend webhook → BFF endpoint → email to `info@kcvvelewijt.be`
  with a `[KCVV ALERT]` subject prefix on `email.bounced` / `email.failed` events.
- **Volume alert:** notify when the monthly send count crosses **2 000** (well below the
  3 000 free-tier ceiling), giving runway before the cap.

## 9. DNS Records — As-Built Snapshot

> ⚠️ **DNS — DO NOT TOUCH.**
> The records on `send.kcvvelewijt.be` (DKIM, MX, SPF) and the apex `_dmarc` are **already in
> production use by an internal sponsortool**. Resend was set up later and verifies cleanly
> against those same records (Resend sends through Amazon SES — the same records work for
> both). They are documented here **for the record only**; **no DNS changes are part of this
> spec or its implementation issues**, except the single additive DMARC change in §9.1.

| Type | Host                                    | Value                                                                                                                                                                                                                        | Priority                      |
| ---- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| TXT  | `resend._domainkey.send.kcvvelewijt.be` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDRTEhGPC8O3lFG/BaAdVvZWzuRw16UJXKDouB2MoDR8xEGicagmaiGidbgR53hUhOM7I30Tc0sKDaeLj8hfOj71o1J4ueYznUu1aW8EMpbfjfSd3a0SnuQsE+8atopDwzLwKdOFBgPLEtVI9JUNQHyj0uR8bj0wj4WU8NrpinMTwIDAQAB` | —                             |
| MX   | `send.kcvvelewijt.be`                   | `feedback-smtp.eu-west-1.amazonses.com`                                                                                                                                                                                      | 10                            |
| TXT  | `send.kcvvelewijt.be`                   | `v=spf1 include:amazonses.com ~all`                                                                                                                                                                                          | —                             |
| TXT  | `_dmarc.kcvvelewijt.be` (apex)          | `v=DMARC1; p=none;`                                                                                                                                                                                                          | — (current — updated in §9.1) |

**Why SES records are correct for Resend:** the MX (`feedback-smtp.eu-west-1.amazonses.com`)
and SPF (`include:amazonses.com`) records point at Amazon SES because Resend's sending
infrastructure _is_ Amazon SES. This is expected and correct — it is **not** a
misconfiguration, and should pre-empt confusion at code-review time.

### 9.1 DMARC — one additive change in this spec

The apex DMARC record gets the aggregate-report directive (`rua`) appended so receivers
(Gmail, Microsoft, etc.) start emailing daily summaries of who is sending mail "from"
`kcvvelewijt.be`. This is **reporting-only** — it does **not** change how any mail is treated
and is safe for the sponsortool's existing flow.

| Before              | After                                                |
| ------------------- | ---------------------------------------------------- |
| `v=DMARC1; p=none;` | `v=DMARC1; p=none; rua=mailto:dmarc@kcvvelewijt.be;` |

**Prerequisite — `dmarc@kcvvelewijt.be` must exist.** It is set up as a **forwarding alias to
the technical maintainer**, not a new mailbox and not a forward into `info@`. Rationale:
aggregate reports are verbose XML attachments that arrive daily — routing them to the person
who actually reviews DMARC keeps `info@` clean and avoids provisioning a standalone mailbox.

This `rua` addition is a **manual, one-time DNS edit** performed by whoever administers the
zone; it is not automated by any code in the downstream issues.

Further DMARC tightening (`p=quarantine`, `p=reject`) is **out of scope** here and would only
happen later, after ~30 days of aggregate-report review (tracked as a downstream issue).

## 10. Downstream Implementation Issues

Each is (or will be) filed with a `blocked-by` relationship referencing this spec (#1469):

| Feature                                               | Issue            | Notes                                                      |
| ----------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| In-page membership intake form                        | **#1473** (open) | First consumer; replaces the external Google Form          |
| Contact-form replacement of `mailto:` links           | _to open_        | Replaces apex `mailto:` links with a posted form           |
| Sponsorship inquiry form                              | _to open_        | Public form → `formSubmission` + Resend send               |
| Alerting webhook handler (Resend webhook → BFF email) | _to open_        | Implements §8 bounce/failure + volume alerting             |
| DMARC `p=quarantine` / `p=reject` escalation          | _to open_        | After ~30 days of `rua` aggregate-report review (per §9.1) |

The shared building blocks the first form issue (#1473) must establish — the
`POST /forms/membership` BFF endpoint, the `formSubmission` Sanity document, Turnstile
verification, and the Resend client wiring — are reused by every later form, so they belong
in the first implementation rather than this spec.

## 11. Budget

The free tier (3 000/month, 100/day) is the cap. The §8 volume alert at 2 000/month gives
runway before the ceiling. **No paid tier is authorized.**

## 12. Open Questions

_None — all decisions are locked above. New unknowns discovered during downstream
implementation are recorded on the relevant implementation issue, not here._
