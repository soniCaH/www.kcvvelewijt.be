# 6.C.d5 · Staff — LOCKED

**Decision:** Compact centred cards. Locked 2026-05-28
(`6cd5-staff/round-1-staff.html`, treatment A).

- **Card:** `<TapedCard>`-framed, centred — round photo (newsprint) **or
  monogram fallback** (initials, jersey-deep on cream-soft) + name (first
  semibold + last italic) + **function** (mono caption).
- **Function label:** show `staffMember.functionTitle` (PSD) rendered readable —
  map known codes `T1→Hoofdtrainer`, `T2→Assistent-trainer`, `TK→Keeperstrainer`,
  `TVJO→Jeugdcoördinator`; pass through already-readable values; **fall back to
  the role bucket** (`Trainer` / `Afgevaardigde`) when `functionTitle` is null.
- **Grid:** `auto-fill minmax(~150px)`. Section auto-hides when `staff` is empty.
- Smaller scale than `<PlayerCard>` (staff sit below the squad).

## Cross-references

- Artifact: `6cd5-staff/round-1-staff.html`.
- Function-code mapping mirrors the organigram role codes (T1/T2/TK/TVJO).
