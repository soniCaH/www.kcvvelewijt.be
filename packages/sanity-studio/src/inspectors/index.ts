export {GuideFormInput} from './guide-input'
// `GuideBody` and `guideContent` are deliberately NOT re-exported here: the
// only consumer, guide-input.tsx, imports them directly from
// `./guide-body` / `./guide-content` (as does guide-content.test.ts), so a
// re-export through this barrel has no reader — see the `Alert` barrel
// (apps/web/src/components/design-system/Alert/index.ts) for the same
// pattern and why an unused barrel re-export isn't free here.
export type {GuideEntry} from './guide-model'
