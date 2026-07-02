import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {ChevronDownIcon, ChevronRightIcon, TrashIcon} from '@sanity/icons'
import {type JSX} from 'react'
import {
  MemberField,
  MemberFieldError,
  useFormValue,
  type ObjectItemProps,
} from 'sanity'

/**
 * Inline Q&A authoring (#2277). Custom `components.item` renderers for the
 * `qaPair` and `qaPairRespondent` array items. Instead of the default
 * preview-row-that-opens-a-dialog, each item renders its own fields **in
 * place** by iterating `props.inputProps.members` and delegating to Sanity's
 * real field/input renderers via `<MemberField>`. This is what collapses the
 * old 3-modal path (block → pair → respondent) down to a single dialog: the
 * PT answer editor and the existing `RespondentPicker` are reused verbatim,
 * never reimplemented.
 *
 * The parent array keeps its native chrome — the "Add" button and drag
 * reorder come from Sanity's array input; per-item remove uses `onRemove`
 * and per-pair collapse uses the `collapsed`/`onExpand`/`onCollapse` trio.
 */

type InputMembers = ObjectItemProps['inputProps']

/**
 * Render an object item's members (fields) inline, threading every render
 * callback so Portable Text (answer) and custom inputs (RespondentPicker)
 * render fully. Field-level validation renders where each field lives.
 */
function InlineMembers({
  inputProps,
  skipFieldNames,
}: {
  inputProps: InputMembers
  /** Field names to omit from the inline render (e.g. the picker on solos). */
  skipFieldNames?: readonly string[]
}): JSX.Element {
  return (
    <Stack space={4}>
      {inputProps.members.map((member) => {
        if (member.kind === 'field') {
          if (skipFieldNames?.includes(member.name)) return null
          return (
            <MemberField
              key={member.key}
              member={member}
              renderAnnotation={inputProps.renderAnnotation}
              renderBlock={inputProps.renderBlock}
              renderInlineBlock={inputProps.renderInlineBlock}
              renderField={inputProps.renderField}
              renderInput={inputProps.renderInput}
              renderItem={inputProps.renderItem}
              renderPreview={inputProps.renderPreview}
            />
          )
        }
        if (member.kind === 'error') {
          return <MemberFieldError key={member.key} member={member} />
        }
        return null
      })}
    </Stack>
  )
}

/**
 * One respondent (RespondentPicker + Portable Text answer) rendered inline in
 * a bordered card, with a remove control. No dialog — the answer editor is
 * reachable without a further modal.
 */
export function QaPairRespondentItem(props: ObjectItemProps): JSX.Element {
  const {inputProps, onRemove, readOnly, index} = props
  // On single-subject interviews the answer auto-attributes to the sole
  // subject (frontend + validator already skip enforcement), so the
  // "who said it" picker is pure ceremony — hide it. It returns only for
  // duo/panel interviews (subjects >= 2).
  const subjects = useFormValue(['subjects'])
  const isSolo = !Array.isArray(subjects) || subjects.length < 2
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold" muted>
            Respondent {index + 1}
          </Text>
          {!readOnly && (
            <Button
              mode="bleed"
              tone="critical"
              icon={TrashIcon}
              onClick={onRemove}
              aria-label="Verwijder respondent"
              fontSize={1}
              padding={2}
            />
          )}
        </Flex>
        <InlineMembers
          inputProps={inputProps}
          skipFieldNames={isSolo ? ['respondentKey'] : undefined}
        />
      </Stack>
    </Card>
  )
}

/**
 * One Q&A pair (question + respondents + tag) rendered inline, collapsible so
 * a long interview stays scannable. The collapsed header shows the question
 * (via the pair's preview title) rather than a raw key.
 */
export function QaPairItem(props: ObjectItemProps): JSX.Element {
  const {
    inputProps,
    onRemove,
    readOnly,
    collapsed,
    collapsible,
    onCollapse,
    onExpand,
    title,
    index,
  } = props
  const heading = title?.trim() || `Vraag ${index + 1}`
  const isCollapsed = collapsed === true
  return (
    <Card border radius={2} padding={3} shadow={1}>
      <Stack space={isCollapsed ? 0 : 4}>
        <Flex align="center" gap={2}>
          {collapsible && (
            <Button
              mode="bleed"
              fontSize={1}
              padding={2}
              icon={isCollapsed ? ChevronRightIcon : ChevronDownIcon}
              onClick={isCollapsed ? onExpand : onCollapse}
              aria-label={isCollapsed ? 'Klap vraag open' : 'Klap vraag dicht'}
            />
          )}
          <Box flex={1}>
            <Text weight="semibold" textOverflow="ellipsis">
              {heading}
            </Text>
          </Box>
          {!readOnly && (
            <Button
              mode="bleed"
              tone="critical"
              icon={TrashIcon}
              onClick={onRemove}
              aria-label="Verwijder vraag"
              fontSize={1}
              padding={2}
            />
          )}
        </Flex>
        {!isCollapsed && <InlineMembers inputProps={inputProps} />}
      </Stack>
    </Card>
  )
}

QaPairRespondentItem.displayName = 'QaPairRespondentItem'
QaPairItem.displayName = 'QaPairItem'
