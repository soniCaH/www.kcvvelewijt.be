# Vercel firewall rule (dashboard, Hobby = 1 rule)

Read this before you change the firewall rule, or add a page that renders on demand from a PSD id. `apps/web/CLAUDE.md` → "Vercel firewall rule" points here.

The project is on Vercel **Hobby**, which allows exactly **one** WAF rate-limit rule. The rule lives **in the Vercel dashboard only** (Project → Firewall → Configure). `vercel.json` cannot hold it, so nothing in this repo creates, changes or checks it — a fresh project or a deleted rule has none until a human sets it again (#3484).

| Setting | Value                                                                                    |
| ------- | ---------------------------------------------------------------------------------------- |
| Name    | `psd-pages-per-ip`                                                                       |
| If      | Request Path → matches regex → `^/(tegenstander\|wedstrijd)/`                            |
| Then    | Rate Limit → Fixed window, **60 s**, **30 requests**, key **IP** → action **Deny** (429) |

Save, then **Publish**. Check it by requesting the **same** real match page 31 times within a minute (same URL = cached, no PSD cost); the last responses are `429`.

**Why these two paths.** `/tegenstander/[clubId]` and `/wedstrijd/[matchId]` are the only pages whose `generateStaticParams` is `[]` over a PSD id: every new valid id renders on demand and costs PSD calls (`/tegenstander` about 4 × (1 + seasons) per club). `parsePsdId` stops junk ids, but a bot walking real-looking integers still mints a fresh render each time — that drains the shared PSD quota and, on Hobby's hard usage limits, can get the whole site paused. Traffic the rule blocks is not billed. Search is not on this rule: the worker limits it (#3468).

**AI Bots managed ruleset: Log** (Project → Firewall → Bot Management, published 2026-10-21, #3620). Log mode records crawler requests and blocks nothing. It runs for 7 days to measure what crawlers cost before any of them is blocked; the numbers go on #3596 and are the baseline for every later crawler ticket. Like the rate-limit rule, it lives in the dashboard only. Change it to anything other than Log only through a #3596 ticket, and update this line in the same change.
