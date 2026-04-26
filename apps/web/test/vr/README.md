# Visual regression baselines

Baselines for `apps/web` Storybook stories are committed under
`__snapshots__/` using the linear naming convention
`<story-id>--<viewport>.png`.

| Path                   | Committed | Purpose                                                |
| ---------------------- | --------- | ------------------------------------------------------ |
| `__snapshots__/`       | yes       | Source-of-truth baselines.                             |
| `__diff_output__/`     | no        | Per-failure diff PNGs uploaded as CI artifacts on red. |
| `__received_output__/` | no        | Captured "actual" PNGs alongside diffs on failure.     |

Captured by `@storybook/test-runner` via the post-visit hook in
`.storybook/test-runner.ts`. See `apps/web/CLAUDE.md` → _Visual Regression
Testing_ for the local workflow and the canonical Claude decision loop.
Background and rationale: `docs/prd/visual-regression-testing.md`.

## Anti-pattern

Do **not** commit baselines captured on macOS or Windows. Linux fonts
render differently, so a macOS-committed baseline guarantees a CI red on
the next PR. Always run `pnpm vr:update` from inside the pinned Docker
container.
