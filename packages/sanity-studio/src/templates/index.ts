import type {LauncherTemplate} from './types'
import {organigramNodeTemplates} from './organigramNode-templates'
import {responsibilityTemplates} from './responsibility-templates'
import {articleTemplates} from './article-templates'
import {sponsorTemplates} from './sponsor-templates'
import {eventTemplates} from './event-templates'
import {pageTemplates} from './page-templates'

export type {LauncherTemplate, LauncherTemplateUi} from './types'
export {isLauncherTemplate} from './types'
export {organigramNodeTemplates} from './organigramNode-templates'
export {responsibilityTemplates} from './responsibility-templates'
export {articleTemplates} from './article-templates'
export {sponsorTemplates} from './sponsor-templates'
export {eventTemplates} from './event-templates'
export {pageTemplates} from './page-templates'

/**
 * Every launcher manifest, concatenated. Both studios register the launcher
 * grid with a single `templates: (prev) => [...prev, ...launcherTemplates]`
 * spread, so adding a new doc type's cards means appending its manifest here —
 * never touching either `sanity.config.ts`. Keep this in `schemaTypes` order.
 */
export const launcherTemplates: LauncherTemplate[] = [
  ...organigramNodeTemplates,
  ...responsibilityTemplates,
  ...articleTemplates,
  ...sponsorTemplates,
  ...eventTemplates,
  ...pageTemplates,
]
