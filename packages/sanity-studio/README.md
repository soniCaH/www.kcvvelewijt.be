# @kcvv/sanity-studio

Shared Sanity Studio UI for KCVV Elewijt — the custom Studio building blocks both
`apps/studio` (production) and `apps/studio-staging` (staging) compose: custom
input/preview components, desk structure, and content migrations.

## Usage

```typescript
import { ... } from "@kcvv/sanity-studio";
import { ... } from "@kcvv/sanity-studio/migrations";
```

Source-only package. Schema _definitions_ live in
[`@kcvv/sanity-schemas`](../sanity-schemas/), not here — this package is presentation
and tooling (e.g. the `applyDecoratorComponents` graft that adds React decorator icons
to the React-free schema marks).
