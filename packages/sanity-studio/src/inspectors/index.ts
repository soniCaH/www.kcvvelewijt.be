import type {DocumentInspectorsResolver} from 'sanity'
import {guideContent} from './guide-content'
import {guidedSidebarInspector} from './guided-sidebar'

export {guidedSidebarInspector} from './guided-sidebar'
export {guideContent} from './guide-content'
export {buildGuideModel} from './guide-model'
export type {GuideEntry, GuideModel, GuideOutstandingItem} from './guide-model'

/**
 * `document.inspectors` resolver: adds the GuidedSidebar inspector for document
 * types that have a `guideContent` entry, and leaves every other type's
 * inspectors untouched. Wire once in each studio's `sanity.config.ts`:
 *
 * ```ts
 * document: { inspectors: guidedSidebarInspectors }
 * ```
 */
export const guidedSidebarInspectors: DocumentInspectorsResolver = (prev, {documentType}) =>
  guideContent[documentType] ? [guidedSidebarInspector, ...prev] : prev
