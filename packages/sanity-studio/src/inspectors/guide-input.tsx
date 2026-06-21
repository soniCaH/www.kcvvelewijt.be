import {Card, Stack} from '@sanity/ui'
import type {JSX} from 'react'
import type {InputProps} from 'sanity'
import {GuideBody} from './guide-body'
import {guideContent} from './guide-content'

/**
 * Global `form.components.input` override that renders the editor guide at the
 * top of every guide-enabled document form. Because it is genuinely part of the
 * form, the guide is always visible (no inspector toggle) and persists across
 * navigation between documents.
 *
 * The override fires for EVERY input at EVERY level, so it gates twice and
 * otherwise renders Sanity's default input untouched:
 *  - `props.path.length === 0` → only the document-root input, never nested
 *    object/array inputs.
 *  - a `guideContent` entry exists for the document type → types without a guide
 *    get no panel and no empty card.
 */
export function GuideFormInput(props: InputProps): JSX.Element {
  const entry = props.path.length === 0 ? guideContent[props.schemaType.name] : undefined
  if (!entry) return props.renderDefault(props)

  return (
    <Stack space={5}>
      <Card padding={4} radius={2} tone="primary" border>
        <GuideBody entry={entry} />
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}
