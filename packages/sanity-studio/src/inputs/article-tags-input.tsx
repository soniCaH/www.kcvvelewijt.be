import {CloseIcon} from '@sanity/icons'
import {Autocomplete, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {
  type FocusEvent,
  type JSX,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  type ArrayOfPrimitivesInputProps,
  PatchEvent,
  insert,
  setIfMissing,
  unset,
  useClient,
} from 'sanity'
import {canonicalizeTagInput, matchTagCandidates} from './match-tag-candidates'

const API_VERSION = '2024-01-01'
const CANONICAL_TAGS_QUERY = `array::unique(*[_type == "article" && defined(tags)].tags[])`

type TagOption = {value: string}

/**
 * Custom Sanity input for `article.tags` that surfaces existing tag values as
 * case-insensitive autocomplete suggestions. Editors can still enter brand-new
 * tags; existing matches are mapped to their canonical casing on commit so that
 * GROQ `in` queries (which are case-sensitive) stay consistent.
 */
export function ArticleTagsInput(props: ArrayOfPrimitivesInputProps<string>): JSX.Element {
  const {value, onChange, readOnly, elementProps} = props
  const client = useClient({apiVersion: API_VERSION})
  const [canonicalTags, setCanonicalTags] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    client
      .fetch<unknown[]>(CANONICAL_TAGS_QUERY)
      .then((result) => {
        if (cancelled) return
        const tags = Array.isArray(result)
          ? result.filter((t): t is string => typeof t === 'string')
          : []
        setCanonicalTags(tags)
      })
      .catch(() => {
        if (!cancelled) setCanonicalTags([])
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const current = value ?? []
  const options = useMemo<TagOption[]>(
    () => matchTagCandidates('', canonicalTags).map((tag) => ({value: tag})),
    [canonicalTags],
  )

  const appendTag = (raw: string) => {
    const canonical = canonicalizeTagInput(raw, canonicalTags)
    if (canonical === '') return
    const needle = canonical.toLowerCase()
    if (current.some((t) => typeof t === 'string' && t.toLowerCase() === needle)) {
      setDraft('')
      return
    }
    // Sanity's positional insert selector: `['before', [0]]` prepends (safe
    // when the array is empty or missing); `['after', [last]]` appends.
    const insertPatch =
      current.length === 0
        ? insert([canonical], 'before', [0])
        : insert([canonical], 'after', [current.length - 1])
    onChange(PatchEvent.from([setIfMissing([]), insertPatch]))
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (draft.trim() === '') return
      appendTag(draft)
      return
    }
    if (event.key === 'Backspace' && draft === '' && current.length > 0) {
      event.preventDefault()
      onChange(PatchEvent.from(unset([current.length - 1])))
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    elementProps.onBlur?.(event)
    if (draft.trim() !== '') appendTag(draft)
  }

  const removeAt = (index: number) => {
    onChange(PatchEvent.from(unset([index])))
  }

  return (
    <Stack space={2} data-ui="ArticleTagsInput">
      {current.length > 0 && (
        <Flex gap={2} wrap="wrap">
          {current.map((tag, index) => (
            <Card
              key={`${tag}-${index}`}
              padding={1}
              paddingLeft={3}
              radius={4}
              tone="transparent"
              border
            >
              <Flex align="center" gap={2}>
                <Text size={1}>{tag}</Text>
                {!readOnly && (
                  <Button
                    aria-label={`Verwijder tag ${tag}`}
                    icon={CloseIcon}
                    mode="bleed"
                    padding={1}
                    fontSize={0}
                    onClick={() => removeAt(index)}
                  />
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      <Autocomplete
        id={elementProps.id}
        ref={elementProps.ref}
        onFocus={elementProps.onFocus}
        options={options}
        value=""
        onQueryChange={(query) => setDraft(query ?? '')}
        onSelect={appendTag}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        openButton
        disabled={readOnly}
        placeholder="Typ een tag en druk op Enter"
        filterOption={(query, option) =>
          option.value.toLowerCase().startsWith(query.trim().toLowerCase())
        }
      />
    </Stack>
  )
}

ArticleTagsInput.displayName = 'ArticleTagsInput'
