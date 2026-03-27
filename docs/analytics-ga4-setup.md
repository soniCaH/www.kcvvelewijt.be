# GA4 Dashboard, Funnels & Reports — Setup Guide

This guide walks you through configuring Google Analytics 4 for the KCVV analytics
instrumentation. All steps are manual — done in the GA4 web UI at
[analytics.google.com](https://analytics.google.com).

**Prerequisite**: GA4 property linked to GTM, GTM deployed to production,
and at least one real user session with analytics consent given.

---

## Table of Contents

1. [How to navigate GA4](#1-how-to-navigate-ga4)
2. [Verify events are arriving](#2-verify-events-are-arriving)
3. [Register custom dimensions](#3-register-custom-dimensions)
4. [Create funnels](#4-create-funnels)
   - [4a. Responsibility Finder Funnel](#4a-responsibility-finder-funnel)
   - [4b. Search Funnel](#4b-search-funnel)
   - [4c. Organigram Usage Exploration](#4c-organigram-usage-exploration)
   - [4d. Related Content Funnel](#4d-related-content-funnel)
5. [Create custom reports](#5-create-custom-reports)
   - [5a. Responsibility Finder Success Rate](#5a-responsibility-finder-success-rate)
   - [5b. Responsibility No-Results (Content Gaps)](#5b-responsibility-no-results-content-gaps)
   - [5c. Search Click-Through Rate](#5c-search-click-through-rate)
   - [5d. Search Dead Ends (Index Gaps)](#5d-search-dead-ends-index-gaps)
   - [5e. Organigram View Preference](#5e-organigram-view-preference)
   - [5f. Related Content CTR by Source](#5f-related-content-ctr-by-source)
   - [5g. Related Content Type Engagement](#5g-related-content-type-engagement)
   - [5h. Related Content Position Bias](#5h-related-content-position-bias)
6. [Verify download tracking](#6-verify-download-tracking)
7. [Quick reference: events & reports](#7-quick-reference-events--reports)

---

## 1. How to navigate GA4

When you open [analytics.google.com](https://analytics.google.com) and select the KCVV
property, you land on the **Home** screen. The left sidebar has five sections:

| Sidebar item    | What it is                                                         |
| --------------- | ------------------------------------------------------------------ |
| **Home**        | Overview dashboard with auto-generated cards                       |
| **Reports**     | Standard reports: traffic, engagement, pages, devices              |
| **Explore**     | Where you build custom funnels and reports (called "Explorations") |
| **Advertising** | Attribution and conversion paths                                   |
| **Configure**   | Events list, custom definitions, audiences, DebugView              |

We will mostly work in **Explore** and **Configure**.

---

## 2. Verify events are arriving

Before setting anything up, confirm GA4 is receiving the KCVV custom events.

### 2a. Use DebugView (requires a tagged browser)

DebugView shows events from individual browser sessions in real time.

1. Open the site in Chrome and accept the analytics cookie consent.
2. Open Chrome DevTools → Console → run:
   ```javascript
   dataLayer
   ```
   You should see an array with `gtm.js`, `gtm.dom`, `gtm.load` entries.
3. In GA4, go to **Configure** → **DebugView** (bottom of the left sidebar under Configure).
4. In DebugView, your browser session should appear in the left panel within 10–30 seconds.
5. Click something on the site — e.g., use the responsibility finder — and watch events
   appear in the timeline.

> **If nothing appears**: Check that `NEXT_PUBLIC_GTM_ID` is set in Vercel environment
> variables and that the GTM container has a GA4 Configuration tag publishing to the
> correct Measurement ID.

### 2b. Use the Realtime report

1. In GA4, go to **Reports** → **Realtime**.
2. While actively using the site, you will see event counts update live.
3. Scroll down to the **Event count by Event name** card — you should see custom event
   names like `responsibility_role_selected`, `search_submitted`, etc.

### 2c. Check the Events report (24–72h delay)

1. In GA4, go to **Reports** → **Engagement** → **Events**.
2. This report lists all events received in the last 28 days with total counts.
3. Note: there is a 24–72 hour data processing delay — newly instrumented events will
   not appear here immediately.

---

## 3. Register custom dimensions

GA4 automatically tracks standard parameters (`page_location`, `session_id`, etc.)
but **custom event parameters are invisible in reports unless you register them first**
as Custom Dimensions.

You have 50 custom dimension slots. We will use 20.

### How to add a custom dimension

1. In GA4, go to **Configure** → **Custom definitions**.
2. Click **Create custom dimensions** (top right, blue button).
3. Fill in the form:
   - **Dimension name**: a human-readable label (used in reports)
   - **Scope**: choose **Event**
   - **Description**: optional but helpful
   - **Event parameter**: the exact parameter name from the code
4. Click **Save**.

Repeat for each row in the table below.

### Dimensions to register

| Dimension name     | Event parameter      | Where it appears                                                            |
| ------------------ | -------------------- | --------------------------------------------------------------------------- |
| Role               | `role`               | Responsibility finder events                                                |
| Query text         | `query_text`         | Search & responsibility no-results events                                   |
| Query length       | `query_length`       | Search & responsibility events                                              |
| Results count      | `results_count`      | `search_results_shown`, `responsibility_search`                             |
| Path ID            | `path_id`            | Responsibility finder events                                                |
| Category           | `category`           | `responsibility_suggestion_clicked`, `responsibility_dwell`                 |
| Position           | `position`           | `responsibility_suggestion_clicked`, `search_result_clicked`, `related_content_click` |
| Contact type       | `contact_type`       | `responsibility_contact_clicked` ("email" / "phone")                        |
| Dwell seconds      | `dwell_seconds`      | `responsibility_dwell`                                                      |
| Had results        | `had_results`        | `responsibility_abandon`                                                    |
| Filter type        | `filter_type`        | `search_filter_changed`                                                     |
| Result type        | `result_type`        | `search_result_clicked`, `related_content_click`                            |
| Result title       | `result_title`       | `search_result_clicked`                                                     |
| Organigram view    | `view`               | Organigram events                                                           |
| Interaction source | `source`             | `organigram_view_changed`, `related_content_*`                              |
| Department         | `department`         | `organigram_department_filtered`                                            |
| Member ID          | `member_id`          | `organigram_member_clicked`                                                 |
| Target type        | `target_type`        | `related_content_click`, `related_content_shown`                            |
| Target ID          | `target_id`          | `related_content_click`                                                     |
| Source entity type | `source_entity_type` | `related_content_shown`, `related_content_click`                            |

> **Tip**: The dimension name is only a label for the GA4 UI. The event parameter must
> match the code exactly (case-sensitive, snake_case).

---

## 4. Create funnels

Funnels in GA4 live under **Explore**. Each funnel is a separate "Exploration".

Explorations are **per-user** — they are not shared with colleagues by default.
After creating each one, use **Share exploration** (top-right kebab menu → Share) to
make it accessible to anyone in the GA4 property.

### 4a. Responsibility Finder Funnel

**Key question**: Do users find the right person?

1. In GA4, click **Explore** in the left sidebar.
2. Click the **+** button at the top of the template gallery.
3. In the left panel under **Technique**, click the dropdown and select
   **Funnel exploration**.
4. In the top-left, rename the exploration to **"Responsibility Finder Funnel"**.

**Configure the funnel steps** — click the **pencil icon** next to "Steps" in the
right panel to open the step editor:

**Step 1 — Role selected**
- Click **Add step**
- Step name: `Role selected`
- Click **Add condition** → Event name → `responsibility_role_selected`

**Step 2 — Search performed**
- Click **Add step**
- Step name: `Search performed`
- Condition: Event name → `responsibility_search`

**Step 3 — Suggestion clicked**
- Click **Add step**
- Step name: `Suggestion clicked`
- Condition: Event name → `responsibility_suggestion_clicked`

**Step 4 — Success**
- Click **Add step**
- Step name: `Success (contact or dwell)`
- Condition: Event name → `responsibility_contact_clicked`
- Click **Or** (inside the same step) → Event name → `responsibility_dwell`

**Step 5 — Abandoned**
- Click **Add step**
- Step name: `Abandoned`
- Condition: Event name → `responsibility_abandon`

Click **Apply** to close the step editor.

**Add a breakdown by role (optional):** In the right panel scroll to **Breakdown** →
select the **Role** dimension. This shows which roles have the lowest completion rates.

**Set date range:** Top-right corner → **Last 28 days**.

**Share:** Top-right kebab menu (⋮) → **Share exploration**.

---

### 4b. Search Funnel

**Key question**: Do search results drive clicks?

1. **Explore** → **+** → Technique: **Funnel exploration**.
2. Rename to **"Search Funnel"**.

**Steps:**

**Step 1 — Search submitted**
- Condition: Event name → `search_submitted`

**Step 2 — Results shown**
- Condition: Event name → `search_results_shown`

**Step 3 — Result clicked**
- Condition: Event name → `search_result_clicked`

**Set funnel type to Open:** In the right panel, find the **Funnel type** toggle and
switch from **Closed** to **Open**. Open funnel allows users to enter at any step —
more realistic for search since users may land on the search page from a direct link.

**Breakdown:** Add **Result type** dimension to see which content types (article,
player, team) receive the most clicks.

**Share the exploration.**

---

### 4c. Organigram Usage Exploration

This is a **Free form** exploration (pivot table), not a funnel.

1. **Explore** → **+** → leave Technique as **Free form**.
2. Rename to **"Organigram Usage"**.

**Add variables** (left panel — click **+** next to Dimensions and Metrics):

Dimensions to add:
- Event name
- Organigram view
- Interaction source
- Department
- Member ID

Metrics to add:
- Event count

**Tab 1 — View distribution** (centre panel, Tab settings):

- Drag **Event name** to **Rows**
- Drag **Organigram view** to **Columns**
- Drag **Event count** to **Values**
- Add a filter: Event name → contains → `organigram_`

This creates a pivot table: each row is an organigram event, each column is a view
mode (cards / chart / responsibilities).

**Tab 2 — Member engagement:** Click **+** at the top of the canvas to add a tab.
Name it "Member Clicks".

- Rows: **Member ID**
- Values: **Event count**
- Filter: Event name → exactly matches → `organigram_member_clicked`
- Sort: Event count descending

**Share the exploration.**

---

### 4d. Related Content Funnel

**Key question**: Are AI-generated suggestions useful, or does manual curation outperform them?

1. **Explore** → **+** → Technique: **Funnel exploration**.
2. Rename to **"Related Content Funnel"**.

**Steps:**

**Step 1 — Content shown**
- Condition: Event name → `related_content_shown`

**Step 2 — Content clicked**
- Condition: Event name → `related_content_click`

**Breakdown:** Add **Interaction source** dimension (values: `ai` / `editorial` /
`reference`). The drop-off from Step 1 to Step 2 per source directly answers whether
AI suggestions are performing compared to manually curated content.

**Share the exploration.**

---

## 5. Create custom reports

All of these are **Free form** explorations.

### 5a. Responsibility Finder Success Rate

**Goal**: % of searches that end in a contact click or 5s+ dwell.

1. **Explore** → **+** → Free form.
2. Rename to **"Responsibility Finder — Success Rate"**.

**Variables:** Dimensions: Event name — Metrics: Event count

**Tab settings:**
- Rows: Event name
- Values: Event count
- Filter: Event name → contains → `responsibility_`

Read the counts and compute:

```
Success rate = (responsibility_contact_clicked + responsibility_dwell) / responsibility_search × 100
```

> **Optional — mark as conversions**: In **Configure** → **Events**, toggle
> `responsibility_contact_clicked` and `responsibility_dwell` as conversions. GA4 will
> then report a conversion rate automatically in the standard Conversions report.

---

### 5b. Responsibility No-Results (Content Gaps)

**Goal**: Which queries return no results, indicating missing content.

1. **Explore** → **+** → Free form.
2. Rename to **"Responsibility — No Results Queries"**.

**Variables:** Dimensions: Query text, Role — Metrics: Event count

**Tab settings:**
- Rows: Query text
- Columns: Role
- Values: Event count
- Filter: Event name → exactly matches → `responsibility_no_results`
- Sort: Event count descending

High-frequency entries indicate responsibilities that should exist but are not in the
content.

---

### 5c. Search Click-Through Rate

**Goal**: % of searches that lead to a result click.

1. **Explore** → **+** → Free form.
2. Rename to **"Search — Click-Through Rate"**.

**Variables:** Dimensions: Event name — Metrics: Event count

**Tab settings:**
- Rows: Event name
- Values: Event count
- Filter: Event name → one of → `search_submitted`, `search_results_shown`,
  `search_result_clicked`, `search_no_results`

Compute from the counts:

```
CTR           = search_result_clicked / search_submitted × 100
Dead-end rate = search_no_results     / search_submitted × 100
```

---

### 5d. Search Dead Ends (Index Gaps)

**Goal**: Which queries return no results, indicating search index gaps.

1. **Explore** → **+** → Free form.
2. Rename to **"Search — No Results Queries"**.

**Variables:** Dimensions: Query text — Metrics: Event count

**Tab settings:**
- Rows: Query text
- Values: Event count
- Filter: Event name → exactly matches → `search_no_results`
- Sort: Event count descending

---

### 5e. Organigram View Preference

**Goal**: Which view mode do users actually use?

1. **Explore** → **+** → Free form.
2. Rename to **"Organigram — View Preference"**.

**Variables:** Dimensions: Organigram view, Interaction source — Metrics: Event count

**Tab settings:**
- Rows: Organigram view
- Columns: Interaction source
- Values: Event count
- Filter: Event name → exactly matches → `organigram_view_changed`

---

### 5f. Related Content CTR by Source

**Goal**: AI vs editorial vs reference — which source has the best click-through rate?

1. **Explore** → **+** → Free form.
2. Rename to **"Related Content — CTR by Source"**.

**Variables:** Dimensions: Event name, Interaction source — Metrics: Event count

**Tab settings:**
- Rows: Interaction source
- Columns: Event name
- Values: Event count
- Filter: Event name → one of → `related_content_shown`, `related_content_click`

For each source (`ai`, `editorial`, `reference`) you see impressions vs clicks.
Divide `related_content_click` by `related_content_shown` per row to get CTR.

---

### 5g. Related Content Type Engagement

**Goal**: Which content types get the most related-content clicks?

1. **Explore** → **+** → Free form.
2. Rename to **"Related Content — Type Engagement"**.

**Variables:** Dimensions: Target type, Interaction source — Metrics: Event count

**Tab settings:**
- Rows: Target type
- Columns: Interaction source
- Values: Event count
- Filter: Event name → exactly matches → `related_content_click`

---

### 5h. Related Content Position Bias

**Goal**: Do users click position 1, or do they scroll through suggestions?

1. **Explore** → **+** → Free form.
2. Rename to **"Related Content — Position Bias"**.

**Variables:** Dimensions: Position, Target type — Metrics: Event count

**Tab settings:**
- Rows: Position
- Columns: Target type
- Values: Event count
- Filter: Event name → exactly matches → `related_content_click`
- Sort: Position ascending

A steep drop-off from position 1 to 2 means users rarely scroll — informs how many
suggestions are worth surfacing.

---

## 6. Verify download tracking

GA4's **Enhanced Measurement** automatically tracks clicks on links to common file
extensions (`.pdf`, `.doc`, `.xls`, `.csv`, `.zip`, etc.) as `file_download` events.

### Check if Enhanced Measurement is enabled

1. In GA4, go to **Configure** → **Data Streams**.
2. Click your web data stream (the KCVV website entry).
3. Under **Enhanced measurement**, verify the toggle is **On**.
4. Click the gear icon next to the toggle → confirm **File downloads** is checked.

### Test file download tracking

1. Accept analytics consent on the live site.
2. Click any PDF link (sponsor brochure, form, etc.).
3. In GA4 **DebugView**, watch for a `file_download` event within 10 seconds.
4. The event will include `file_name`, `file_extension`, and `link_url` automatically.

### Decision: Enhanced Measurement vs custom events

**Conclusion**: Enhanced Measurement is sufficient for general file download tracking.
Custom events are only needed if you want to distinguish specific download categories
(e.g., "sponsor brochure" vs "registration form") or track JavaScript-triggered
downloads that are not plain `<a href>` links.

**For now**: rely on Enhanced Measurement. Revisit with a dedicated issue if specific
download context is needed.

---

## 7. Quick reference: events & reports

### Events by feature area

| Feature area          | Event names                                                                                                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsibility finder | `responsibility_role_selected`, `responsibility_search`, `responsibility_no_results`, `responsibility_suggestion_clicked`, `responsibility_contact_clicked`, `responsibility_organigram_link`, `responsibility_step_link_clicked`, `responsibility_dwell`, `responsibility_abandon` |
| Search                | `search_submitted`, `search_results_shown`, `search_no_results`, `search_filter_changed`, `search_result_clicked`                                                                                                                                                    |
| Organigram            | `organigram_view_changed`, `organigram_member_clicked`, `organigram_search_used`, `organigram_department_filtered`, `organigram_export_png`                                                                                                                          |
| Related content       | `related_content_shown`, `related_content_click`                                                                                                                                                                                                                     |
| Downloads (auto)      | `file_download` (GA4 Enhanced Measurement)                                                                                                                                                                                                                           |

### Where to find each report

| Report name                          | Location in GA4                              | Key metric                                    |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------- |
| Responsibility Finder Funnel         | Explore → Responsibility Finder Funnel       | Step-to-step completion rate                  |
| Search Funnel                        | Explore → Search Funnel                      | search_submitted → result_clicked drop-off    |
| Organigram Usage                     | Explore → Organigram Usage                   | View mode distribution, member engagement     |
| Related Content Funnel               | Explore → Related Content Funnel             | CTR by source (AI vs editorial vs reference)  |
| Responsibility Finder — Success Rate | Explore → Responsibility Finder Success Rate | (contact_clicked + dwell) / search            |
| Responsibility — No Results Queries  | Explore → Responsibility No Results Queries  | Queries with zero results (content gaps)      |
| Search — Click-Through Rate          | Explore → Search Click-Through Rate          | result_clicked / submitted                    |
| Search — No Results Queries          | Explore → Search No Results Queries          | Queries with zero results (index gaps)        |
| Organigram — View Preference         | Explore → Organigram View Preference         | Which view is used most                       |
| Related Content — CTR by Source      | Explore → Related Content CTR by Source      | Clicks / impressions per source               |
| Related Content — Type Engagement    | Explore → Related Content Type Engagement    | Click counts per target_type                  |
| Related Content — Position Bias      | Explore → Related Content Position Bias      | Click distribution by position                |
| All events overview                  | Reports → Engagement → Events                | Raw event counts (24–72h delay)               |
| Realtime events                      | Reports → Realtime                           | Live event counts                             |
| DebugView                            | Configure → DebugView                        | Individual session event timeline             |
| File downloads                       | Reports → Engagement → Events → file_download | file_name, file_extension breakdown          |
| Traffic sources                      | Reports → Acquisition → Traffic acquisition  | Where visitors come from                      |
| Top pages                            | Reports → Engagement → Pages and screens     | Most visited pages, bounce rate               |
