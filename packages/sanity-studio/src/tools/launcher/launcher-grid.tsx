import {Box, Container, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {type JSX, useMemo, useState} from 'react'

import type {LauncherTemplate} from '../../templates/types'
import {LauncherCard} from './launcher-card'

export interface LauncherGridProps {
  templates: ReadonlyArray<LauncherTemplate>
  onSelect: (template: LauncherTemplate) => void
}

/**
 * Group templates by `ui.group`, preserving the first-seen group order.
 * Pure helper — exported for unit tests.
 */
export function groupByUiGroup(
  templates: ReadonlyArray<LauncherTemplate>,
): {group: string; templates: LauncherTemplate[]}[] {
  const order: string[] = []
  const map = new Map<string, LauncherTemplate[]>()
  for (const template of templates) {
    const key = template.ui.group
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(template)
  }
  return order.map((group) => ({group, templates: map.get(group)!}))
}

/**
 * Case-insensitive substring search across the title, description,
 * group label, and schemaType. Pure — exported for unit tests.
 */
export function searchTemplates(
  templates: ReadonlyArray<LauncherTemplate>,
  query: string,
): LauncherTemplate[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return [...templates]
  return templates.filter((template) => {
    const haystack = `${template.title} ${template.ui.description} ${template.ui.group} ${template.schemaType}`.toLowerCase()
    return haystack.includes(trimmed)
  })
}

export function LauncherGrid({templates, onSelect}: LauncherGridProps): JSX.Element {
  const [query, setQuery] = useState('')
  const grouped = useMemo(() => groupByUiGroup(searchTemplates(templates, query)), [templates, query])

  return (
    <Container width={3} padding={4}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={3}>Wat wil je aanmaken?</Heading>
          <Text size={1} muted>
            Kies een sjabloon hieronder. Elke kaart legt uit wanneer je dit type document gebruikt.
          </Text>
        </Stack>
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Zoek een sjabloon…"
          aria-label="Zoek een sjabloon"
        />
        {grouped.length === 0 ? (
          <Box padding={4}>
            <Text muted>Geen sjabloon gevonden voor &ldquo;{query}&rdquo;.</Text>
          </Box>
        ) : (
          grouped.map(({group, templates: groupTemplates}) => (
            <Stack key={group} space={3}>
              <Heading size={1}>{group}</Heading>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {groupTemplates.map((template) => (
                  <LauncherCard key={template.id} template={template} onSelect={onSelect} />
                ))}
              </div>
            </Stack>
          ))
        )}
      </Stack>
    </Container>
  )
}
