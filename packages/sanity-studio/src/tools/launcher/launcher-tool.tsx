import {ComposeSparklesIcon} from '@sanity/icons'
import {useRouter} from 'sanity/router'
import type {JSX} from 'react'
import type {Tool} from 'sanity'

import type {LauncherTemplate} from '../../templates/types'
import {LauncherGrid} from './launcher-grid'
import {useTemplates} from './use-templates'

/**
 * Root component of the LauncherTool. Reads launcher-eligible templates
 * from the workspace via `useTemplates()` and dispatches an intent
 * navigation when an editor picks a card. Sanity routes the intent to
 * a new draft seeded by the template's `value`.
 *
 * `useRouter()` from `sanity/router` resolves to the workspace router
 * inside a Tool — `navigateIntent('create', …)` bubbles up out of the
 * Tool and lands the editor in a new draft. (Sanity's own structure
 * tool follows the same pattern.)
 */
export function LauncherTool(): JSX.Element {
  const templates = useTemplates()
  const router = useRouter()

  const handleSelect = (template: LauncherTemplate) => {
    router.navigateIntent('create', {
      type: template.schemaType,
      template: template.id,
    })
  }

  return <LauncherGrid templates={templates} onSelect={handleSelect} />
}

/**
 * Tool definition consumed by `apps/studio/sanity.config.ts` and
 * `apps/studio-staging/sanity.config.ts` via `tools: (prev) => [...prev, launcherTool()]`.
 *
 * The factory function shape mirrors Sanity's plugin convention so a
 * future "options" argument (e.g. recents persistence, group ordering)
 * lands additively without breaking call sites.
 */
export function launcherTool(): Tool {
  return {
    name: 'launcher',
    title: 'Create',
    icon: ComposeSparklesIcon,
    component: LauncherTool,
  }
}
