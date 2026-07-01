# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's GitHub Issues.

| Canonical role    | Label in our tracker | Meaning                                                 |
| ----------------- | -------------------- | ------------------------------------------------------- |
| `needs-triage`    | `needs-triage`       | Maintainer needs to evaluate this issue                 |
| `needs-info`      | `needs-info`         | Waiting on reporter for more information                |
| `ready-for-agent` | `ready`              | Fully specced, ready for an AFK agent (existing label)  |
| `ready-for-human` | `ready-for-human`    | Requires human implementation                           |
| `wontfix`         | `wontfix`            | Will not be actioned (existing label)                   |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

`ready` and `wontfix` already exist in this repo — reuse them, don't create duplicates. `ready` maps to Ralph's existing "fully specced" semantics, so `/triage`'s `ready-for-agent` and Ralph's `ready` are the same label. The other three (`needs-triage`, `needs-info`, `ready-for-human`) don't exist yet — `gh label create` them on first use, or let the skill create them.

Edit the right-hand column to match whatever vocabulary you actually use.
