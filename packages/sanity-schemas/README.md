# @kcvv/sanity-schemas

Shared Sanity schema definitions (documents + objects) for the KCVV Elewijt content model.

**Single source of truth.** Both Studios — `apps/studio` (production) and
`apps/studio-staging` (staging) — import these identical definitions. There are no
per-studio schema copies; editing a file in `src/` applies to both Studios automatically.

## Usage

```typescript
import { schemaTypes } from "@kcvv/sanity-schemas";
```

Source-only package, consumed directly by both Studio configs. All schema files live
in `src/`. Schemas here stay React-free; presentation grafts (custom input/preview
components, decorator icons) live in [`@kcvv/sanity-studio`](../sanity-studio/).
