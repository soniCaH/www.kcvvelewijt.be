import type {LauncherTemplate} from './types'
import {responsibilityTemplates} from './responsibility-templates'
import {articleTemplates} from './article-templates'

export type {LauncherTemplate, LauncherTemplateUi} from './types'
export {isLauncherTemplate} from './types'
export {responsibilityTemplates} from './responsibility-templates'
export {articleTemplates} from './article-templates'

/**
 * Every launcher manifest, concatenated. Both studios register the launcher
 * grid with a single `templates: (prev) => [...prev, ...launcherTemplates]`
 * spread, so adding a new doc type's cards means appending its manifest here —
 * never touching either `sanity.config.ts`. Keep this in `schemaTypes` order.
 */
export const launcherTemplates: LauncherTemplate[] = [...responsibilityTemplates, ...articleTemplates]
