import {useMemo} from 'react'
import {useSource, useTemplates as useSanityTemplates} from 'sanity'

import type {LauncherTemplate} from '../../templates/types'
import {filterLauncherTemplates} from './filter-launcher-templates'

/**
 * React hook that returns the launcher-eligible templates registered
 * on the current Sanity workspace. Filters out templates without a
 * `ui` block (Sanity's auto-generated and third-party templates) and
 * templates whose `schemaType` is not registered in the workspace
 * schema. Unknown types are logged once per filter pass.
 *
 * AC: `useTemplates()` filters out templates without `ui` and
 * templates with unknown `schemaType`; logs once to console for
 * unknown types. (Issue #1499)
 */
export function useTemplates(): LauncherTemplate[] {
  const allTemplates = useSanityTemplates()
  const {schema} = useSource()

  return useMemo(
    () =>
      filterLauncherTemplates(
        allTemplates,
        (schemaType) => schema.get(schemaType) !== undefined,
        (schemaType) =>
          console.warn(
            `[LauncherTool] template references unknown schemaType "${schemaType}" — ignored.`,
          ),
      ),
    [allTemplates, schema],
  )
}
