import {Card, Flex, Radio, Stack, Text} from '@sanity/ui'
import {type ChangeEvent, type JSX, useEffect, useMemo, useState} from 'react'
import {
  PatchEvent,
  set,
  type StringInputProps,
  unset,
  useClient,
  useFormValue,
} from 'sanity'

const API_VERSION = '2024-01-01'

// Matches the shape of `subject` in packages/sanity-schemas/src/subject.ts.
// Kept intentionally narrow — we only consume the discriminator + the two
// ref shapes + `customName`. Everything else comes from the ref deref.
interface SubjectItem {
  _key?: string
  kind?: 'player' | 'staff' | 'custom'
  playerRef?: {_ref?: string}
  staffRef?: {_ref?: string}
  customName?: string
}

interface ResolvedPerson {
  _id: string
  firstName?: string
  lastName?: string
}

/**
 * Custom input for `qaPair.respondentKey`. Reads the parent article's
 * `subjects[]` via `useFormValue(['subjects'])` and renders a radio list
 * scoped to those subjects (never the global player pool). Selection
 * writes the chosen subject's `_key`.
 *
 * Resolves player/staff references with a single GROQ fetch so the radio
 * shows real names ("Maxim Breugelmans") rather than opaque IDs.
 *
 * Graceful states:
 *
 * - No subjects yet → placeholder message; nothing to pick.
 * - 1 subject only → shows a single pre-selected option (validator skips,
 *   but editors may still see it on `key`/`quote` pairs authored before
 *   subjects[] was populated).
 * - Unresolved ref → falls back to "Player (loading)" / "Staff (loading)".
 * - Dangling value (points at a subject no longer in subjects[]) →
 *   keeps the underlying value but the radio shows no matching option;
 *   the schema validator surfaces the "no longer one of the article
 *   subjects" error so editors know to re-pick.
 */
export function RespondentPicker(props: StringInputProps): JSX.Element {
  const {value, onChange, readOnly, elementProps} = props
  const subjects = (useFormValue(['subjects']) as SubjectItem[] | undefined) ?? []
  const client = useClient({apiVersion: API_VERSION})
  const [resolved, setResolved] = useState<ResolvedPerson[]>([])

  const refIds = useMemo(() => {
    const ids = subjects
      .map((s: SubjectItem): string | undefined => {
        if (s?.kind === 'player') return s.playerRef?._ref
        if (s?.kind === 'staff') return s.staffRef?._ref
        return undefined
      })
      .filter((ref: string | undefined): ref is string => typeof ref === 'string' && ref.length > 0)
    return Array.from(new Set(ids))
  }, [subjects])

  useEffect(() => {
    if (refIds.length === 0) {
      setResolved([])
      return
    }
    let cancelled = false
    client
      .fetch<ResolvedPerson[]>(`*[_id in $ids]{_id, firstName, lastName}`, {ids: refIds})
      .then((result) => {
        if (!cancelled) setResolved(Array.isArray(result) ? result : [])
      })
      .catch(() => {
        if (!cancelled) setResolved([])
      })
    return () => {
      cancelled = true
    }
  }, [client, refIds])

  const labelForSubject = (s: SubjectItem): string => {
    if (s?.kind === 'custom') return s.customName?.trim() || 'Custom (zonder naam)'
    if (s?.kind === 'player') {
      const doc = resolved.find((r) => r._id === s.playerRef?._ref)
      if (!doc) return 'Speler (laden…)'
      return [doc.firstName, doc.lastName].filter(Boolean).join(' ') || 'Speler (zonder naam)'
    }
    if (s?.kind === 'staff') {
      const doc = resolved.find((r) => r._id === s.staffRef?._ref)
      if (!doc) return 'Staff (laden…)'
      return [doc.firstName, doc.lastName].filter(Boolean).join(' ') || 'Staff (zonder naam)'
    }
    return '(onbekende subject-kind)'
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextKey = event.currentTarget.value
    if (!nextKey) {
      onChange(PatchEvent.from(unset()))
      return
    }
    onChange(PatchEvent.from(set(nextKey)))
  }

  if (subjects.length === 0) {
    return (
      <Card padding={3} radius={2} tone="caution" border data-ui="RespondentPicker-empty">
        <Text size={1}>
          Voeg eerst subjects toe aan dit artikel. De respondent-keuze is scoped op
          de subjects van dit interview.
        </Text>
      </Card>
    )
  }

  return (
    <Stack space={2} data-ui="RespondentPicker">
      {subjects.map((subject, index) => {
        const key = subject?._key
        if (!key) return null
        const label = labelForSubject(subject)
        const id = `${elementProps.id}-option-${index}`
        // Forward Sanity's elementProps to the FIRST radio only — Studio
        // uses them to manage focus (tab-into this field, validation
        // highlight, etc.). Later radios keep their own id/name wiring.
        const isFirst = index === 0
        return (
          <Flex key={key} align="center" gap={3}>
            <Radio
              id={isFirst ? elementProps.id : id}
              name={elementProps.id}
              value={key}
              checked={value === key}
              onChange={handleChange}
              disabled={readOnly}
              ref={isFirst ? elementProps.ref : undefined}
              onFocus={isFirst ? elementProps.onFocus : undefined}
              onBlur={isFirst ? elementProps.onBlur : undefined}
            />
            <Text as="label" htmlFor={isFirst ? elementProps.id : id} size={1}>
              {label}
            </Text>
          </Flex>
        )
      })}
    </Stack>
  )
}

RespondentPicker.displayName = 'RespondentPicker'
