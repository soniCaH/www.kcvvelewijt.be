# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's GitHub Issues. All three KCVV repos use the same names (#3695).

| Canonical role    | Label in our tracker | Meaning                                  |
| ----------------- | -------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent`    | Fully specced, ready for an AFK agent    |
| `ready-for-human` | `ready-for-human`    | Requires human implementation            |
| `wontfix`         | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

A spec or PRD issue never gets `ready-for-agent`: it is the only AFK gate, so a labelled spec becomes an agent brief for its whole decision set. Only its sliced tickets get it.

Two more labels take an issue out of every queue, whatever else it carries: `blocked` (waits on someone outside) and `postponed` (parked by our choice). The pickers in `~/personal-skills/ralph-afk/scripts/` skip both.
