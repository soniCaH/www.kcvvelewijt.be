# AWS account inventory — what runs in `652463040004`, and what it costs

> **Provenance.** Research ticket [#3548](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3548),
> part of map [#3547](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3547). Measured on
> **2026-10-18** with the AWS CLI (`aws-cli/2.4.11`), profile `serverless-admin`
> (`arn:aws:iam::652463040004:user/serverless-admin`), read-only calls only (`list-*`, `describe-*`,
> `get-*`, `ce get-cost-and-usage`, `cloudwatch get-metric-statistics`). Every claim below is the
> output of one of those calls unless it cites a file. No secret value was read into this document:
> environment variables are listed by **key** only, and the Slack webhook is shown by host only.

## Answer in one paragraph

The account costs **about USD 24–25 a month** (USD 20 before 21 % Belgian VAT), plus **USD 11 twice a
year** for two domain renewals. **Two thirds of the bill is one line: the API Gateway cache cluster
(0.5 GB, USD 14.40–14.88/month)** — `serverless.yml` turns it on with `apiGatewayCaching.enabled: true`.
The KCVV old API (`kcvv-api-psd-prod`) is fully alive: 23 Lambdas on `nodejs18.x`, 4 daily EventBridge
schedules, 12 SQS queues, 2 DynamoDB tables (6 050 items, 24 MB), one REST API behind the custom domain
`footbalisto.be` — and it served **76 867 requests in the last 30 days**, because the live Gatsby site
on Netlify still calls `https://footbalisto.be/…`. **The account is not KCVV-only**: it also holds
Kevin's personal `van-ransbeeck.be` DNS zone and its SES inbound mail, a stopped Mastodon EC2 instance
with an Elastic IP (USD 4/month), and four other personal or experiment leftovers. "Close the AWS
account" would break `van-ransbeeck.be` mail; the decommission must be resource-by-resource.

## Method

- Regions: all 17 enabled regions from `aws ec2 describe-regions` were swept for Lambda, API Gateway
  (v1 + v2, custom domains), ACM, DynamoDB, SNS, SQS, EventBridge rules, CloudWatch log groups and
  alarms, CloudFormation, CodeCommit, CodeBuild, CodePipeline, CodeDeploy, CodeStar connections,
  Secrets Manager, SSM parameters, SES (v1 + v2), Amplify, EC2 instances/volumes/addresses/NAT
  gateways/non-default VPCs, RDS, ELBv2, KMS customer aliases, ECR, Step Functions, Cognito, Backup,
  Lightsail, Elastic Beanstalk, OpenSearch and Kinesis. **Only `eu-west-1` and `us-east-1` hold
  anything.** The other 15 regions returned empty lists for every service.
- Global: S3 (`s3api list-buckets`, `s3 ls --recursive --summarize`), Route 53 hosted zones and
  registered domains, CloudFront, IAM, Organizations, Budgets, CloudTrail.
- Cost: `ce get-cost-and-usage`, monthly, 2025-10-01 → 2026-10-18, grouped by `SERVICE`, and
  2026-07 → 2026-09 grouped by `USAGE_TYPE`.
- Usage: `cloudwatch get-metric-statistics`, 30-day sums (2026-09-18 → 2026-10-18).
- **Not swept:** EventBridge Scheduler (`aws scheduler`). The installed CLI 2.4.11 predates that
  service, so it is unverified. EventBridge **rules** were swept. No `serverless.yml` or console
  evidence points to Scheduler use.

## Cost

### Last 13 months, by service (USD, unblended, Cost Explorer)

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

Lambda, CloudWatch Logs, SNS and data transfer never appear: they stay inside the free tier.
The CloudWatch billing metric `EstimatedCharges` read USD 27.15 on 2026-10-18 — above the
**USD 25 "Estimated Cost Alarm"** in `us-east-1`, which is in state `ALARM`.

### Where the money goes (2026-07 → 2026-09, by usage type)

| Usage type                       | USD / month | Belongs to                                           |
| -------------------------------- | ----------- | ---------------------------------------------------- |
| `EU-ApiGatewayCacheUsage:0.5GB`  | 14.40–14.88 | KCVV — the `prod` stage's cache cluster              |
| `EU-PublicIPv4:IdleAddress`      | 3.60–3.72   | **Not KCVV** — Mastodon Elastic IP on a stopped VM   |
| `HostedZone`                     | 1.00        | 0.50 KCVV (`footbalisto.be`) + 0.50 `van-ransbeeck.be` |
| `EU-EBS:VolumeUsage`             | 0.44        | **Not KCVV** — Mastodon 8 GB root volume             |
| `EU-Requests-Tier1` (SQS)        | 0.30        | KCVV — the 12 queues' polling                        |
| `EU-ApiGatewayRequest`           | 0.12–0.15   | KCVV                                                 |
| DynamoDB read + write units      | 0.08–0.13   | KCVV                                                 |
| `EU-TimedStorage-ByteHrs` (S3)   | 0.03        | mixed — mostly Mastodon media + deployment bucket    |
| `DNS-Queries`                    | 0.02        | mixed                                                |
| Registrar (`Amazon Registrar`)   | 11.00 × 2/yr | one renewal each for `footbalisto.be` and `van-ransbeeck.be` |

**KCVV's share** is about **USD 15.50/month before VAT (≈ USD 18.75 with VAT)** plus about USD 11 a
year for `footbalisto.be`. The rest (≈ USD 4.50/month + one renewal) is personal and stays after the
KCVV decommission unless Kevin deletes it separately.

## Inventory by service

"Last used" is the newest evidence found: a CloudWatch metric, a role's `RoleLastUsed`, an object's
`LastModified`, or a deploy date. Monthly cost is from the table above; "free" means inside the free
tier or not billed.

### Lambda — `eu-west-1`

23 functions, all `kcvv-api-psd-prod-*`, all `nodejs18.x`, all last deployed **2024-09-14 08:34 UTC**.
256 MB except `api-calendar-get` and `api-share-instagram-get` (1 024 MB). Every function carries the
same 30 environment-variable **keys**: `PSD_API_CLUB`, `PSD_API_KEY`, `PSD_API_AUTH`,
`DYNAMODB_TABLE_SEASONS`, `DYNAMODB_TABLE_TEAMS_DATA`, three `DYNAMODB_INDEX_*`, three `LAMBDA_*`,
six `SNS_TOPIC_*`, twelve `SQS_QUEUE_*`, `S3_BUCKET_NAME`. The PSD credentials are therefore stored in
plain text in **all 23** function configurations.

| Function (prefix `kcvv-api-psd-prod-`) | Trigger                         | Invocations 30 d | Errors 30 d |
| -------------------------------------- | ------------------------------- | ---------------- | ----------- |
| `team-list`                            | invoked by other Lambdas        | 14 625           | 0           |
| `parse-match`                          | SQS `parse-match`               | 10 817           | 0           |
| `api-calendar-get`                     | HTTP `GET /calendar`            | 9 302            | 0           |
| `parse-player-stats`                   | SQS `parse-player-stats`        | 8 780            | 0           |
| `api-matches-next-get`                 | HTTP `GET /matches/next`        | 8 055            | 0           |
| `seasons-current`                      | invoked by other Lambdas        | 6 701            | 0           |
| `api-matches-prev-get`                 | HTTP `GET /matches/prev`        | 2 959            | 0           |
| `api-stats-player-get`                 | HTTP `GET /stats/player/{id}`   | 2 232            | 0           |
| `api-ranking-get`                      | HTTP `GET /ranking/{teamId}`    | 1 582            | 0           |
| `api-matches-get`                      | HTTP `GET /matches/{teamId}`    | 1 578            | 1           |
| `api-stats-team-get`                   | HTTP `GET /stats/team/{teamId}` | 1 531            | 0           |
| `parse-team-stats`                     | SQS `parse-team-stats`          | 990              | 0           |
| `parse-rankings`                       | SQS `process-ranking`           | 990              | 0           |
| `update-all-player-stats`              | SQS `process-player-stats`      | 990              | 0           |
| `update-all-matches`                   | SQS `process-matches`           | 989              | 0           |
| `update-all-seasons`                   | EventBridge `rate(1 day)`       | 30               | 0           |
| `update-all-events`                    | EventBridge `rate(1 day)`       | 30               | 0           |
| `update-teams-list`                    | EventBridge `rate(1 day)`       | 30               | 0           |
| `update-all-teams`                     | EventBridge `cron(0 5 ? * * *)` | 30               | 0           |
| `api-share-instagram-get`              | HTTP `GET /share/instagram/{slug}` | 0             | —           |
| `api-events-get`                       | HTTP `GET /events/{action}`     | 0                | —           |
| `api-match-get`                        | HTTP `GET /match/{matchId}`     | 0                | —           |
| `seasons-list`                         | none found                      | 0                | —           |

Cost: free. The shared execution role `kcvv-api-psd-prod-eu-west-1-lambdaRole` was last used
2026-10-18 08:01 UTC — this morning's run.

### API Gateway — `eu-west-1` (REST) and edge

| Resource                                   | Detail                                                                                   | Last used         | USD / month |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------- | ----------- |
| REST API `kcvv-api-psd-prod` (`9reu5z4r6j`) | created 2021-07-03; one stage `prod`, **cache cluster enabled, 0.5 GB, `AVAILABLE`**      | today             | 14.5–15.0   |
| Custom domain `footbalisto.be`              | **EDGE** endpoint → `d3ivchfwarb8rv.cloudfront.net` (AWS-managed CloudFront, TLS 1.2); one base-path mapping `(none)` → `9reu5z4r6j/prod` | today | in the above |
| API key + usage plan                        | one usage plan named `KCVV Elewijt`; no API keys listed                                  | —                 | free        |
| HTTP APIs (v2)                              | none                                                                                     | —                 | —           |

30-day traffic: `Count` 76 867, `CacheHitCount` 13 361, `CacheMissCount` 27 239, `4XXError` 36 267,
`5XXError` 1. Almost half of all requests end in a 4xx. The cache earns 13 361 hits a month for
USD 14.40.

### ACM

| Certificate                          | Region      | Status | Expires    | Used by                                                      |
| ------------------------------------ | ----------- | ------ | ---------- | ------------------------------------------------------------ |
| `footbalisto.be`, `www.footbalisto.be` | `us-east-1` | ISSUED | 2027-03-02 | the API Gateway edge domain's CloudFront distribution (AWS-owned account `631144002099`) |

No certificates in `eu-west-1` or any other region. Free.

### Route 53

| Zone / domain      | Records | Contents                                                                                       | Registrar renewal          | USD / month |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------- | -------------------------- | ----------- |
| `footbalisto.be`   | 6       | `A`/`AAAA` alias → `d3ivchfwarb8rv.cloudfront.net`; NS; SOA; two ACM validation CNAMEs          | auto-renew on, expires 2027-07-03 | 0.50 + 11/yr |
| `van-ransbeeck.be` | 9       | `MX` → `inbound-smtp.eu-west-1.amazonaws.com`; 3 SES DKIM CNAMEs; `home.` → Nabu Casa (Home Assistant); `social.` `A` → `54.229.255.72` (the Mastodon EIP) | auto-renew on, expires 2027-11-16 | 0.50 + 11/yr |

Both domains are **registered** in this account (Route 53 Domains), not only hosted. The
`kcvvelewijt.be` zone is **not** here: its NS are `dns1–4.p07.nsone.net` (Netlify), its `MX` is Google
Workspace.

### DynamoDB — `eu-west-1`

| Table                          | Items | Size      | Billing         | GSIs | PITR     | Backups |
| ------------------------------ | ----- | --------- | --------------- | ---- | -------- | ------- |
| `kcvv-api-psd-teams-data-prod` | 6 042 | 25 612 707 B (24.4 MB) | PAY_PER_REQUEST | 1 | DISABLED | none |
| `kcvv-api-psd-seasons-prod`    | 8     | 351 B     | PAY_PER_REQUEST | 1    | DISABLED | none    |

Cost: USD 0.08–0.23/month. Created 2021-07-03. No on-demand backups exist, so the map's "back up
before delete" step has nothing to fall back on.

### S3 (global; regions as listed)

| Bucket                                                       | Region      | Objects | Size     | Newest object | Belongs to                       |
| ------------------------------------------------------------ | ----------- | ------- | -------- | ------------- | -------------------------------- |
| `kcvv-api-psd-prod-serverlessdeploymentbucket-1vc6lw6dts1vn` | `eu-west-1` | 14      | 373.7 MB | 2024-09-14    | KCVV — Serverless deploy artefacts (CloudFormation-owned) |
| `kcvv-api-psd-prod-images`                                   | `eu-west-1` | 2       | 298 B    | 2024-09-14    | KCVV — `S3_BUCKET_NAME`, nearly empty |
| `codepipeline-eu-west-1-301112073406`                        | `eu-west-1` | 61      | 3.8 MB   | 2024-09-14    | KCVV — pipeline artefacts        |
| `ransbek-kcvv`                                               | `eu-west-1` | 2       | 152 KB   | 2021-02-23    | KCVV-named experiment, 2021      |
| `ransbek-sam`                                                | `eu-west-1` | 7       | 41.0 MB  | 2021-02-25    | SAM experiment, 2021             |
| `hello-sam-stack-mybucket-15f273y74mefl`                     | `eu-west-1` | 1       | 1.1 MB   | 2021-02-23    | SAM tutorial, 2021               |
| `ransbek-images`, `ransbek-images-dest`                      | `eu-west-1` | 0       | 0        | —             | empty, 2021                      |
| `vanransbeeck-mastodon`                                      | `eu-west-1` | 4 416   | 993.5 MB | 2023-01-29    | **personal** — Mastodon media    |
| `ransbeeck-mailbox`                                          | `eu-west-1` | 24      | 1.4 MB   | 2026-07-16    | **personal** — SES inbound mail for `van-ransbeeck.be`, still receiving |
| `aws-vwr-sample-coremodulestack-13ti6-loggingbucket-…`       | `us-east-1` | 6       | 11.8 KB  | 2024-10-04    | AWS Virtual Waiting Room sample, 2024 (failed delete) |
| `serverless.metrics-firehose-backup-…`                       | `us-east-1` | 0       | 0        | —             | CloudTrail target, trail off since 2023 |

Total ≈ 1.41 GB, USD 0.03/month. `kcvv-api-psd-prod-images` has no bucket policy.

### SNS

| Topic                                         | Region      | Subscriptions               | Belongs to |
| --------------------------------------------- | ----------- | --------------------------- | ---------- |
| `kcvv-api-psd-prod-update-team-sns-topic`     | `eu-west-1` | 4 × SQS                     | KCVV       |
| `kcvv-api-psd-prod-parse-match-sns-topic`     | `eu-west-1` | 1 × SQS                     | KCVV       |
| `kcvv-api-psd-prod-parse-player-stats-sns-topic` | `eu-west-1` | 1 × SQS                  | KCVV       |
| `Default_CloudWatch_Alarms_Topic`             | `eu-west-1` | 1 × email                   | KCVV alarm `Lambda Errors` |
| `ransbeeck-mail`                              | `eu-west-1` | 1 × email                   | personal (SES inbound) |
| `CloudWatch_EstimatedCost_Alarm`              | `us-east-1` | 1 × email                   | account billing alarm |
| (`LambdaTrigger` — subscription only)         | `eu-west-1` | 1 × Lambda, topic no longer listed | orphan |

Free.

### SQS — `eu-west-1`

12 queues, all `kcvv-api-psd-prod-*`, all 0 messages visible: `parse-match`, `parse-player-stats`,
`parse-team-stats`, `process-matches`, `process-player-stats`, `process-ranking`, each with a `-dlq`.
Six event-source mappings, all `Enabled` (see the Lambda table). USD 0.26–0.34/month — the Lambda
pollers' empty receives.

### EventBridge — `eu-west-1`

| Rule                                                   | State   | Schedule            | Target                       |
| ------------------------------------------------------ | ------- | ------------------- | ---------------------------- |
| `kcvv-api-psd-prod-UpdateDashallDashteamsEventsRule-…` | ENABLED | `cron(0 5 ? * * *)` | `update-all-teams`           |
| `kcvv-api-psd-prod-UpdateDashallDashseasonsEventsRu-…` | ENABLED | `rate(1 day)`       | `update-all-seasons`         |
| `kcvv-api-psd-prod-UpdateDashallDasheventsEventsRul-…` | ENABLED | `rate(1 day)`       | `update-all-events`          |
| `kcvv-api-psd-prod-UpdateDashteamsDashlistEventsRul-…` | ENABLED | `rate(1 day)`       | `update-teams-list`          |
| `codepipeline-kcvvap-master-615389-rule`               | ENABLED | event pattern       | CodePipeline on CodeCommit `master` push |

These four schedules are what the go-live list's _Turn off the old data app's daily job_ disables.
EventBridge Scheduler: not checked (see Method).

### CloudWatch

- **Log groups, `eu-west-1`:** 23 `/aws/lambda/kcvv-api-psd-prod-*` (retention 30 days, 0–5.6 MB each,
  ≈ 23 MB total), `/aws/codebuild/kcvv-api-psd` (**never expires**, 2.3 MB),
  `/aws/lambda/SenseDeepWatcher` (**never expires**, 0.8 MB — the function no longer exists).
- **Log groups, `us-east-1`:** 4 `/aws/lambda/aws-vwr-sample-*` (never expire, < 10 KB each, 2024-10-04).
- **Alarms:** `Lambda Errors` (`eu-west-1`, `AWS/Lambda Errors > 0`, state OK) and
  `Estimated Cost Alarm` (`us-east-1`, threshold USD 25, state **ALARM**).
- **Dashboards:** `LambdaMonitoring`, `SQSMonitoring` (2021-06-07), `CachingMonitoring` (2021-09-10).
- Cost: free (3 dashboards and 2 alarms are inside the free tier).

### CloudFormation

| Stack                                        | Region      | Status          | Last change | Notes |
| -------------------------------------------- | ----------- | --------------- | ----------- | ----- |
| `kcvv-api-psd-prod`                          | `eu-west-1` | UPDATE_COMPLETE | 2024-09-14  | owns the Lambdas, API, tables, topics, queues, rules, role, both `kcvv-api-psd-prod-*` buckets |
| `aws-vwr-sample`                             | `us-east-1` | DELETE_FAILED   | 2024-10-04  | nested stack failed |
| `aws-vwr-sample-CoreModuleStack-13TI6KFM490ZN` | `us-east-1` | DELETE_FAILED | 2024-10-04  | left: `LoggingBucket` (DELETE_SKIPPED) and IAM group `…-ProtectedApiGroup-…` (DELETE_FAILED) |

### Code* (CI/CD) — `eu-west-1`

| Resource                                | Detail                                                                               | Last used  |
| --------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| CodeCommit `kcvv-api-psd`               | default `master`; branches `master`, `develop`, `feature/chromium`; created 2021-03-10 | last push 2024-09-14 |
| CodeBuild `kcvv-api-psd`                | source CODECOMMIT, image `aws/codebuild/standard:5.0`, role `CodeBuild_Serverless_Admin`, one plaintext env var `ENV_NAME`; runs `buildspec.yml` → `sls deploy` | role last used 2024-09-14 |
| CodePipeline `kcvv-api-psd-pipeline`    | Source (CodeCommit) → Build (CodeBuild); created 2021-03-10                          | role last used 2024-09-14 |
| CodeDeploy                              | none                                                                                 | —          |
| CodeStar connections / notifications    | none                                                                                 | —          |

Free (one active pipeline is inside the free tier). The local clone
`~/Sites/KCVV/kcvv-api-psd` has `origin = ssh://git-codecommit.eu-west-1.amazonaws.com/v1/repos/kcvv-api-psd`
and the same last commit (`a3d3933`, 2024-09-14).

### IAM

| Principal                                     | Kind  | Created    | Last used                | Notes |
| --------------------------------------------- | ----- | ---------- | ------------------------ | ----- |
| `serverless-admin`                            | user  | 2021-02-02 | key `AKIA…MDMX` active, created 2021-02-02 | **`AdministratorAccess`, no MFA, key never rotated in 5.7 years.** Its last-used stamp (2026-10-18, `amplify`, `ca-central-1`) is this research's own sweep. No console password. |
| `kcvv-api-psd-prod-eu-west-1-lambdaRole`      | role  | 2021-07-03 | 2026-10-18 08:01         | Lambda execution role |
| `CodeBuild_Serverless_Admin`                  | role  | 2021-03-10 | 2024-09-14               | CodeBuild |
| `AWS-CodePipeline-Service`                    | role  | 2021-03-10 | 2024-09-14               | CodePipeline |
| `cwe-role-eu-west-1-kcvv-api-psd-pipeline`    | role  | 2021-03-10 | 2024-09-14               | EventBridge → pipeline |
| `Grafana`                                     | role  | 2021-06-07 | never                    | unused |
| `aws-vwr-sample-CoreModuleStack-13-ProtectedApiGroup-…` | group | 2024-10-04 | —                | VWR sample leftover |

Service-linked roles: API Gateway, EventBridge API Destinations, Compute Optimizer, Cost Optimization
Hub, ElastiCache, Support, Trusted Advisor. The root account has MFA (`AccountMFAEnabled = 1`). The
account is not in an AWS Organization.

### Secrets Manager, SSM Parameter Store

None in any region. Every secret lives in Lambda environment variables or in source (see below).

### SES — `eu-west-1`

| Identity                 | Type   | Verified | Belongs to |
| ------------------------ | ------ | -------- | ---------- |
| `kcvvelewijt.be`         | domain | Success, DKIM Success | KCVV (legacy) |
| `info@kcvvelewijt.be`, `social@kcvvelewijt.be`, `evenementen@kcvvelewijt.be` | email | Success | KCVV (legacy) |
| `van-ransbeeck.be`       | domain | Success  | personal   |
| `climacon@gmail.com`     | email  | Success  | personal   |

Production access on, sending enabled, **0 sends in the last 24 h and 0 send data points in the last
two weeks**. Active receipt rule set `Default` has one rule: mail for `van-ransbeeck.be` → S3
(`ransbeeck-mailbox`). No local KCVV repo (`www.kcvvelewijt.be`, `uitbetaling`, `sponsorship-platform`,
`kcvv-data-api`, `KCVV-Elewijt-Gatsby`) references `aws-sdk`/`@aws-sdk` or SES. Free.

### EC2 — `eu-west-1` (not KCVV)

| Resource                         | Detail                                          | USD / month |
| -------------------------------- | ----------------------------------------------- | ----------- |
| `i-0bb6d90c71b9e5d62` "Kevin Mastodon" | `t4g.micro`, **stopped**, launched 2022-11-17 | 0 (stopped) |
| `vol-0de05cdf2181fcdfa`          | 8 GB, attached to the instance                  | 0.44        |
| EIP `54.229.255.72`              | associated to the stopped instance → billed as idle | 3.60–3.72 |

No snapshots, NAT gateways, load balancers or non-default VPCs.

### CloudFront, Amplify, CloudTrail, Budgets

- **CloudFront:** no distributions of the account's own. The only distribution is the AWS-managed one
  behind the API Gateway edge domain.
- **Amplify:** no apps in any region.
- **CloudTrail:** one multi-region trail `serverless_trail` (home `us-east-1`), **not logging** since
  2023-03-03, target bucket empty.
- **Budgets:** none.

## Where the Slack webhook lives

The `[LAMBDA UPDATE] …` messages come from a **hardcoded** Slack incoming-webhook URL in
`~/Sites/KCVV/kcvv-api-psd/api/util.js` line 127 (`baseURL: 'https://hooks.slack.com/<redacted>'`,
posted with `axios`). It is in no Lambda environment variable, no SSM parameter and no Secrets Manager
secret. It is therefore in every deployed Lambda bundle (the deployment bucket's zips) and in the
CodeCommit history — and will be in the planned archived GitHub copy.

## Surprises — not described in `serverless.yml`

1. **The account is shared with Kevin's personal infrastructure.** `van-ransbeeck.be` (registered
   domain, hosted zone, SES inbound mail into `ransbeeck-mailbox` with mail as recent as 2026-07-16,
   DKIM, a Home Assistant CNAME) lives here. Closing the account, or a blanket "delete everything",
   breaks Kevin's business domain and its mail.
2. **A stopped Mastodon server costs USD 4.16/month** (idle EIP 3.72 + EBS 0.44) and has a 993 MB media
   bucket. `social.van-ransbeeck.be` still points at its EIP. Not KCVV, but the second-largest line.
3. **The API Gateway cache is two thirds of the bill** (USD 14.40–14.88/month for 13 361 cache hits a
   month). It is in `serverless.yml`, but nobody priced it.
4. **The old API still serves the live site.** 76 867 requests in 30 days, because the Gatsby site on
   Netlify calls `https://footbalisto.be/ranking/…`, `/calendar` and `/share/instagram/…`
   (`KCVV-Elewijt-Gatsby/gatsby-node.ts`, `src/pages/calendar.tsx`, `src/pages/share.tsx`, `.env`).
   The API cannot go before the Gatsby site does. 47 % of requests end in a 4xx.
5. **`footbalisto.be` is registered and auto-renewed here** (USD 11/year, expires 2027-07-03), with an
   edge custom domain and a `us-east-1` ACM certificate. An archived PRD
   (`docs/prd/archive/2026/architecture-housekeeping.md`) once earmarked it for the new BFF; the new
   BFF does not use it (`apps/api/wrangler.toml` has no route, no repo code references it). Keep or
   let it lapse is a decision for the map.
6. **Six KCVV-adjacent leftovers from 2021 experiments**: S3 buckets `ransbek-kcvv`, `ransbek-sam`,
   `hello-sam-stack-mybucket-…`, `ransbek-images`, `ransbek-images-dest`, and the unused IAM role
   `Grafana`.
7. **A half-deleted AWS Virtual Waiting Room sample** (2024-10-04) in `us-east-1`: two
   `DELETE_FAILED` stacks, a logging bucket, an IAM group, four never-expiring log groups.
8. **Orphans from deleted tools**: log group `/aws/lambda/SenseDeepWatcher` (SenseDeep monitoring, no
   function), an SNS subscription to a vanished `LambdaTrigger` topic, a dead CloudTrail trail and its
   empty bucket `serverless.metrics-firehose-backup-…`.
9. **SES still holds verified `kcvvelewijt.be` identities** (domain + `info@`, `social@`,
   `evenementen@`) with production access, unused for at least two weeks and referenced by no repo.
10. **The billing alarm is already firing** — `Estimated Cost Alarm` at USD 25 is in `ALARM` (USD 27.15
    on 2026-10-18, a registrar renewal month).
11. **The admin key is a liability**: `serverless-admin` is the only IAM user, has
    `AdministratorAccess`, no MFA, and one access key from 2021-02-02 that was never rotated.
12. **No backups of any kind**: DynamoDB PITR off on both tables, no on-demand backups, no AWS Backup
    vaults.
13. Three CloudWatch dashboards (2021) and the `Lambda Errors` alarm with its email topic are not in
    `serverless.yml`; they were made by hand.

## Shared with the new stack (Cloudflare / Vercel / Sanity)

- **The PSD API key is the same key.** A hash comparison (no value printed) shows `PSD_API_KEY` and
  `PSD_API_CLUB` in `serverless.yml` equal the values in `apps/api/.dev.vars` of the new BFF.
  `PSD_API_AUTH` does not match byte-for-byte (it may be the same secret in another encoding; not
  investigated). So the key the new BFF runs on is stored in plain text in `serverless.yml`, the
  CodeCommit history, all 23 Lambda configurations and every deployment zip. This is also the shared
  PSD quota problem of [#3059](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3059): two clients,
  one key.
- **Nothing else is shared.** The new stack uses no AWS service: no repo references `aws-sdk`,
  `execute-api`, `amazonaws` or `footbalisto.be` in code. `kcvvelewijt.be` DNS is on Netlify (NS1),
  not Route 53. The SES identities for `kcvvelewijt.be` are unused.

## Secrets to rotate or revoke once the old stack is gone

| Secret                          | Where it sits                                                         | Why rotate                                        |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| PSD API key (+ auth)            | `serverless.yml`, CodeCommit history, 23 Lambda env configs, deploy zips | **shared with the new BFF**; it survives in git history and in the planned archived GitHub copy |
| Slack incoming webhook          | hardcoded in `api/util.js`, CodeCommit history, deploy zips           | revoke the webhook in Slack once the Lambdas are gone |
| `serverless-admin` access key   | local `~/.aws/credentials`                                            | admin, no MFA, 2021; deactivate once only personal resources remain, or replace with a scoped key |

## Not checked

- EventBridge Scheduler schedules (CLI too old to call `aws scheduler`).
- Whether `PSD_API_AUTH` is the same secret as the new BFF's in another encoding.
- The CodePipeline execution history (`list-pipeline-executions` returned nothing; the roles'
  last-used date 2024-09-14 stands in for it).
- Who receives the email subscriptions on the alarm topics (addresses are personal data; not listed).
