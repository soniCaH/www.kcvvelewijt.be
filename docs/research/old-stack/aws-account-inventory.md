# AWS account inventory — what the old API ran, and what it cost

> **Provenance.** Research ticket [#3548](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3548),
> part of map [#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Measured on
> **2026-10-18** with the AWS CLI, read-only calls only (`list-*`, `describe-*`, `get-*`,
> `ce get-cost-and-usage`, `cloudwatch get-metric-statistics`).
>
> **Snapshot, not live state.** The delete plan and its progress live in the runbook
> [#3580](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3580). Since this snapshot the four
> schedules were disabled (2026-10-19) and the tables and images bucket were backed up.
>
> **Cut for a public repo.** The account id, IAM user details, key locations and the owner's personal
> (non-club) resources in the same account are left out on purpose. The full version is kept off this
> public repo.

## Answer in one paragraph

The account cost **about USD 24–25 a month** (USD 20 before 21 % Belgian VAT), plus **USD 11 a year**
for the `footbalisto.be` renewal. **Two thirds of the bill is one line: the API Gateway cache cluster
(0.5 GB, USD 14.40–14.88/month)** — `serverless.yml` turns it on with `apiGatewayCaching.enabled: true`.
The KCVV old API (`kcvv-api-psd-prod`) was fully alive: 23 Lambdas on `nodejs18.x`, 4 daily EventBridge
schedules, 12 SQS queues, 2 DynamoDB tables (6 050 items, 24 MB), one REST API behind the custom domain
`footbalisto.be` — and it served **76 867 requests in the last 30 days**, because the live Gatsby site
on Netlify still called `https://footbalisto.be/…`. **The account is not KCVV-only**: it also holds
personal resources of the owner, so "close the AWS account" is not an option; the decommission must
be resource-by-resource.

## Method

- Regions: all 17 enabled regions were swept for Lambda, API Gateway (v1 + v2, custom domains), ACM,
  DynamoDB, SNS, SQS, EventBridge rules, CloudWatch log groups and alarms, CloudFormation, the Code\*
  services, Secrets Manager, SSM parameters, SES, Amplify, EC2, RDS, ELBv2, KMS, ECR, Step Functions,
  Cognito, Backup, Lightsail, Elastic Beanstalk, OpenSearch and Kinesis. **Only `eu-west-1` and
  `us-east-1` hold anything.**
- Global: S3, Route 53 hosted zones and registered domains, CloudFront, IAM, Organizations, Budgets,
  CloudTrail.
- Cost: `ce get-cost-and-usage`, monthly, 2025-10-01 → 2026-10-18, grouped by `SERVICE`, and
  2026-07 → 2026-09 grouped by `USAGE_TYPE`.
- Usage: `cloudwatch get-metric-statistics`, 30-day sums (2026-09-18 → 2026-10-18).
- **Not swept:** EventBridge Scheduler (`aws scheduler`) — the installed CLI predates it. No
  `serverless.yml` or console evidence points to Scheduler use.

## Cost

### Last 13 months, by service (USD, unblended, Cost Explorer)

Whole account, personal lines included. "VPC" and "EC2-Other" are not KCVV.

| Month   | Total     | API Gateway | VPC (idle IPv4) | Route 53 | EC2-Other (EBS) | SQS  | DynamoDB | S3   | Registrar | Tax  |
| ------- | --------- | ----------- | --------------- | -------- | --------------- | ---- | -------- | ---- | --------- | ---- |
| 2025-10 | 38.35     | 15.02       | 3.72            | 1.02     | 0.44            | 0.32 | 0.14     | 0.03 | 11.00     | 6.66 |
| 2025-11 | 24.30     | 14.54       | 3.60            | 1.02     | 0.44            | 0.30 | 0.15     | 0.03 | —         | 4.22 |
| 2025-12 | 25.05     | 15.00       | 3.72            | 1.02     | 0.44            | 0.33 | 0.17     | 0.03 | —         | 4.35 |
| 2026-01 | 25.12     | 15.02       | 3.72            | 1.02     | 0.44            | 0.33 | 0.19     | 0.03 | —         | 4.36 |
| 2026-02 | 22.93     | 13.65       | 3.36            | 1.02     | 0.44            | 0.26 | 0.19     | 0.03 | —         | 3.98 |
| 2026-03 | 25.19     | 15.04       | 3.72            | 1.02     | 0.44            | 0.34 | 0.23     | 0.03 | —         | 4.37 |
| 2026-04 | 24.39     | 14.54       | 3.60            | 1.02     | 0.44            | 0.31 | 0.22     | 0.03 | —         | 4.23 |
| 2026-05 | 38.44     | 15.00       | 3.72            | 1.02     | 0.44            | 0.34 | 0.22     | 0.03 | 11.00     | 6.67 |
| 2026-06 | 24.14     | 14.50       | 3.60            | 1.02     | 0.44            | 0.28 | 0.08     | 0.03 | —         | 4.19 |
| 2026-07 | 24.91     | 14.99       | 3.72            | 1.02     | 0.44            | 0.31 | 0.08     | 0.03 | —         | 4.32 |
| 2026-08 | 25.00     | 15.02       | 3.72            | 1.02     | 0.44            | 0.32 | 0.11     | 0.03 | —         | 4.34 |
| 2026-09 | 24.29     | 14.55       | 3.60            | 1.03     | 0.44            | 0.30 | 0.13     | 0.03 | —         | 4.22 |
| 2026-10 | 27.13 MTD | 8.07        | 2.00            | 1.02     | 0.23            | —    | 0.09     | 0.02 | 11.00     | 4.71 |

Lambda, CloudWatch Logs, SNS and data transfer never appear: they stay inside the free tier. The
account's USD 25 billing alarm was in state `ALARM` on 2026-10-18 (a registrar renewal month).

### Where the KCVV money goes (2026-07 → 2026-09, by usage type)

| Usage type                      | USD / month  | What                             |
| ------------------------------- | ------------ | -------------------------------- |
| `EU-ApiGatewayCacheUsage:0.5GB` | 14.40–14.88  | the `prod` stage's cache cluster |
| `HostedZone`                    | 0.50         | the `footbalisto.be` zone        |
| `EU-Requests-Tier1` (SQS)       | 0.30         | the 12 queues' polling           |
| `EU-ApiGatewayRequest`          | 0.12–0.15    | API requests                     |
| DynamoDB read + write units     | 0.08–0.13    | the 2 tables                     |
| Registrar (`Amazon Registrar`)  | 11.00 / year | `footbalisto.be` renewal         |

**KCVV's share** is about **USD 15.50/month before VAT (≈ USD 18.75 with VAT)** plus about USD 11 a
year for `footbalisto.be`. The rest of the bill is personal and stays after the KCVV decommission.

## Inventory by service

"Last used" is the newest evidence found: a CloudWatch metric, a role's `RoleLastUsed`, an object's
`LastModified`, or a deploy date.

### Lambda — `eu-west-1`

23 functions, all `kcvv-api-psd-prod-*`, all `nodejs18.x`, all last deployed **2024-09-14**.
256 MB except `api-calendar-get` and `api-share-instagram-get` (1 024 MB). Every function carries the
same 30 environment-variable keys (PSD credentials, DynamoDB tables and indexes, Lambda names, SNS
topics, SQS queues, the S3 bucket). The PSD credentials are therefore in every function configuration.

| Function (prefix `kcvv-api-psd-prod-`) | Trigger                            | Invocations 30 d | Errors 30 d |
| -------------------------------------- | ---------------------------------- | ---------------- | ----------- |
| `team-list`                            | invoked by other Lambdas           | 14 625           | 0           |
| `parse-match`                          | SQS `parse-match`                  | 10 817           | 0           |
| `api-calendar-get`                     | HTTP `GET /calendar`               | 9 302            | 0           |
| `parse-player-stats`                   | SQS `parse-player-stats`           | 8 780            | 0           |
| `api-matches-next-get`                 | HTTP `GET /matches/next`           | 8 055            | 0           |
| `seasons-current`                      | invoked by other Lambdas           | 6 701            | 0           |
| `api-matches-prev-get`                 | HTTP `GET /matches/prev`           | 2 959            | 0           |
| `api-stats-player-get`                 | HTTP `GET /stats/player/{id}`      | 2 232            | 0           |
| `api-ranking-get`                      | HTTP `GET /ranking/{teamId}`       | 1 582            | 0           |
| `api-matches-get`                      | HTTP `GET /matches/{teamId}`       | 1 578            | 1           |
| `api-stats-team-get`                   | HTTP `GET /stats/team/{teamId}`    | 1 531            | 0           |
| `parse-team-stats`                     | SQS `parse-team-stats`             | 990              | 0           |
| `parse-rankings`                       | SQS `process-ranking`              | 990              | 0           |
| `update-all-player-stats`              | SQS `process-player-stats`         | 990              | 0           |
| `update-all-matches`                   | SQS `process-matches`              | 989              | 0           |
| `update-all-seasons`                   | EventBridge `rate(1 day)`          | 30               | 0           |
| `update-all-events`                    | EventBridge `rate(1 day)`          | 30               | 0           |
| `update-teams-list`                    | EventBridge `rate(1 day)`          | 30               | 0           |
| `update-all-teams`                     | EventBridge `cron(0 5 ? * * *)`    | 30               | 0           |
| `api-share-instagram-get`              | HTTP `GET /share/instagram/{slug}` | 0                | —           |
| `api-events-get`                       | HTTP `GET /events/{action}`        | 0                | —           |
| `api-match-get`                        | HTTP `GET /match/{matchId}`        | 0                | —           |
| `seasons-list`                         | none found                         | 0                | —           |

Cost: free.

### API Gateway — `eu-west-1` (REST) and edge

| Resource                       | Detail                                                                                                                | Last used | USD / month  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------- | ------------ |
| REST API `kcvv-api-psd-prod`   | created 2021-07-03; one stage `prod`, **cache cluster enabled, 0.5 GB**                                               | today     | 14.5–15.0    |
| Custom domain `footbalisto.be` | **EDGE** endpoint → `d3ivchfwarb8rv.cloudfront.net` (AWS-managed CloudFront); one base-path mapping `(none)` → `prod` | today     | in the above |
| Usage plan                     | one, named `KCVV Elewijt`; no API keys                                                                                | —         | free         |
| HTTP APIs (v2)                 | none                                                                                                                  | —         | —            |

30-day traffic: `Count` 76 867, `CacheHitCount` 13 361, `CacheMissCount` 27 239, `4XXError` 36 267,
`5XXError` 1. Almost half of all requests end in a 4xx. The cache earns 13 361 hits a month for
USD 14.40.

### ACM, Route 53

- One certificate, `footbalisto.be` + `www.footbalisto.be`, `us-east-1`, expires 2027-03-02, used by
  the edge domain's CloudFront distribution. Free.
- Hosted zone `footbalisto.be`: 6 records (`A`/`AAAA` alias → the CloudFront domain, NS, SOA, two ACM
  validation `CNAME`s). The domain is **registered** here too (Route 53 Domains, auto-renew on,
  expires 2027-07-03).
- The `kcvvelewijt.be` zone is **not** here: its NS are `dns1–4.p07.nsone.net` (Netlify), its `MX` is
  Google Workspace.

### DynamoDB — `eu-west-1`

| Table                          | Items | Size    | Billing         | GSIs | PITR     | Backups |
| ------------------------------ | ----- | ------- | --------------- | ---- | -------- | ------- |
| `kcvv-api-psd-teams-data-prod` | 6 042 | 24.4 MB | PAY_PER_REQUEST | 1    | DISABLED | none    |
| `kcvv-api-psd-seasons-prod`    | 8     | 351 B   | PAY_PER_REQUEST | 1    | DISABLED | none    |

Cost: USD 0.08–0.23/month. Created 2021-07-03. No backups of any kind existed on 2026-10-18 (the
runbook's phase 2.1 made the first ones).

### S3 — KCVV buckets

| Bucket                                           | Objects | Size     | Newest object | What                                               |
| ------------------------------------------------ | ------- | -------- | ------------- | -------------------------------------------------- |
| `kcvv-api-psd-prod-serverlessdeploymentbucket-…` | 14      | 373.7 MB | 2024-09-14    | Serverless deploy artefacts (CloudFormation-owned) |
| `kcvv-api-psd-prod-images`                       | 2       | 298 B    | 2024-09-14    | `S3_BUCKET_NAME`, nearly empty                     |
| `codepipeline-eu-west-1-…`                       | 61      | 3.8 MB   | 2024-09-14    | pipeline artefacts                                 |

Plus a handful of empty or near-empty 2021 experiment buckets and personal buckets. USD 0.03/month
for all of S3.

### SNS, SQS, EventBridge

- **SNS:** three `kcvv-api-psd-prod-*` topics fanning out to SQS, one alarm topic for the hand-made
  `Lambda Errors` alarm, one orphan subscription to a topic that no longer exists. Free.
- **SQS:** 12 queues, all `kcvv-api-psd-prod-*`, 0 messages: `parse-match`, `parse-player-stats`,
  `parse-team-stats`, `process-matches`, `process-player-stats`, `process-ranking`, each with a
  `-dlq`. USD 0.26–0.34/month — the pollers' empty receives.
- **EventBridge rules:** the four `kcvv-api-psd-prod-Update…` schedules (`update-all-teams` at
  `cron(0 5 ? * * *)`, the other three `rate(1 day)`) plus one CodePipeline trigger. These four are
  what the go-live list's _Turn off the old data app's daily job_ disables (done 2026-10-19).

### CloudWatch, CloudFormation, CI/CD

- **Log groups:** 23 `/aws/lambda/kcvv-api-psd-prod-*` (30 days retention, ≈ 23 MB), one CodeBuild
  group and a few orphans that never expire.
- **Alarms:** `Lambda Errors` (OK) and the billing alarm (ALARM). Three dashboards from 2021, made by
  hand, not in `serverless.yml`.
- **CloudFormation:** `kcvv-api-psd-prod` (`UPDATE_COMPLETE`, 2024-09-14) owns the Lambdas, API,
  tables, topics, queues, rules, the execution role and both `kcvv-api-psd-prod-*` buckets. Two
  `DELETE_FAILED` stacks from a 2024 AWS sample are unrelated leftovers.
- **CI/CD:** CodeCommit `kcvv-api-psd` → CodePipeline → CodeBuild (`sls deploy`), all last used
  2024-09-14.

### SES

`kcvvelewijt.be` (domain) and three `@kcvvelewijt.be` addresses are still verified, with 0 sends in two
weeks and no repo referencing SES. Legacy.

## Surprises — not described in `serverless.yml`

1. **The account is shared with personal resources.** A blanket "delete everything" would break them;
   the runbook carries a keep list.
2. **The API Gateway cache is two thirds of the bill** for 13 361 cache hits a month. It is in
   `serverless.yml`, but nobody priced it.
3. **The old API still served the live site.** 76 867 requests in 30 days, because the Gatsby site on
   Netlify called `https://footbalisto.be/ranking/…`, `/calendar` and `/share/instagram/…`. The API
   cannot go before the Gatsby site does. 47 % of requests end in a 4xx.
4. **`footbalisto.be` is registered and auto-renewed here** (USD 11/year). An archived PRD
   (`docs/prd/archive/2026/architecture-housekeeping.md`) once earmarked it for the new BFF. Its fate
   was decided in [#3552](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3552).
5. **No backups of any kind**: DynamoDB PITR off, no on-demand backups, no AWS Backup vaults.
6. **The deploy credentials need retiring.** The IAM user the old stack deploys with is the last thing
   the runbook deletes (phase 6).

## Shared with the new stack (Cloudflare / Vercel / Sanity)

- **The PSD API key is the same key.** A hash comparison (no value printed) showed the old API and the
  new BFF use the same PSD key and club key. This is also the shared-quota problem of
  [#3059](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3059): two clients, one key.
  ProSoccerData issues no new keys, so it cannot be rotated.
- **Nothing else is shared.** The new stack uses no AWS service: no repo references `aws-sdk`,
  `execute-api`, `amazonaws` or `footbalisto.be` in code.

## Secrets to revoke once the old stack is gone

- The old API's Slack incoming webhook (the `[LAMBDA UPDATE]` posts) — revoke in Slack once the
  Lambdas are gone.
- The deploy IAM user and its access key — deleted last (runbook phase 6).
- The PSD key — cannot be rotated (see above); it leaves with the Lambdas.

## Not checked

- EventBridge Scheduler schedules (CLI too old).
- The CodePipeline execution history (the roles' last-used date 2024-09-14 stands in for it).
- Who receives the alarm e-mails (personal data; not listed).
