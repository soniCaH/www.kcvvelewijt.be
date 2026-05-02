import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import type {JSX} from 'react'

import type {LauncherTemplate} from '../../templates/types'

export interface LauncherCardProps {
  template: LauncherTemplate
  /**
   * Click handler. Called with the template so the parent can call
   * `router.navigateIntent('create', { type, template })` from a single
   * place — keeps the card pure (testable without router context).
   */
  onSelect: (template: LauncherTemplate) => void
}

/**
 * Single template card on the launcher grid. Pure — no router or
 * Sanity-context coupling. The parent owns navigation.
 *
 * Lucide icon resolution is intentionally deferred to Phase 2 — the
 * card renders title/description/badge today; an icon slot will be
 * added when the icon-name registry lands.
 */
export function LauncherCard({template, onSelect}: LauncherCardProps): JSX.Element {
  return (
    <Card
      padding={4}
      radius={3}
      shadow={1}
      tone="default"
      data-testid={`launcher-card-${template.id}`}
      data-schema-type={template.schemaType}
      onClick={() => onSelect(template)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(template)
        }
      }}
      role="button"
      tabIndex={0}
      style={{cursor: 'pointer'}}
    >
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={2} weight="medium">
            {template.title}
          </Text>
        </Flex>
        <Text size={1} muted>
          {template.ui.description}
        </Text>
        <Flex>
          <Badge tone="primary" mode="outline" fontSize={0}>
            {template.schemaType}
          </Badge>
        </Flex>
      </Stack>
    </Card>
  )
}
