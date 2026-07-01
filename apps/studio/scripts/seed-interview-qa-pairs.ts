import {randomBytes} from 'node:crypto'
import {getCliClient} from 'sanity/cli'

/**
 * One-off: convert legacy interview articles (seeded before interview types
 * existed) whose Q&A lives as loose Portable Text — question = `strong`
 * block ending in "?", answer = following `em` block(s) prefixed `— "…"` —
 * into a single structured `qaBlock` (pairs → respondents → answer).
 *
 * Intro paragraphs (before the first question) and outro paragraphs (after
 * the last answer) are kept as body prose; standalone separators (—, ---)
 * are dropped. Answers are cleaned: leading `— "` / trailing `"` stripped,
 * em/strong styling removed (link annotations preserved), multi-paragraph
 * answers kept as multiple blocks.
 *
 * Single-subject interviews → each answer attributed to the sole subject's
 * `_key`. Idempotent: after conversion there are no `strong`-question blocks,
 * so a re-run detects no Q&A and skips.
 *
 * Dry-run by default. Set APPLY=1 to write.
 *
 *   cd apps/studio
 *   npx sanity exec scripts/seed-interview-qa-pairs.ts --with-user-token
 *   APPLY=1 npx sanity exec scripts/seed-interview-qa-pairs.ts --with-user-token
 */

const IDS = [
  '4029e7ec-dc31-47bf-87f1-4caddbc988e4', // Dieter Van Dionant
  'febb5ced-44ce-4858-a5cb-2e2d07708667', // Max Breugelmans
]

const apply = process.env.APPLY === '1'
const client = getCliClient()
const key = () => randomBytes(6).toString('hex')

type Span = {_type?: string; _key?: string; text?: string; marks?: string[]}
type Block = {
  _type: string
  _key?: string
  style?: string
  markDefs?: unknown[]
  children?: Span[]
}

const textOf = (b: Block) => (b.children ?? []).map((c) => c.text ?? '').join('')
const hasMark = (b: Block, m: string) =>
  (b.children ?? []).some((c) => (c.marks ?? []).includes(m))

const isQuestion = (b: Block) =>
  b._type === 'block' &&
  hasMark(b, 'strong') &&
  !hasMark(b, 'em') &&
  textOf(b).trim().endsWith('?')

const isAnswer = (b: Block) => b._type === 'block' && hasMark(b, 'em')

const isSeparator = (b: Block) => {
  if (b._type !== 'block') return false
  const t = textOf(b).trim()
  return t === '' || /^[—–-]{1,3}$/.test(t)
}

/** Strip em/strong (keep link-annotation marks), trim leading `— "` and trailing `"`. */
function cleanAnswer(blocks: Block[]): Block[] {
  const out = blocks.map((b) => ({
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: b.markDefs ?? [],
    children: (b.children ?? []).map((c) => ({
      _type: 'span',
      _key: key(),
      text: c.text ?? '',
      marks: (c.marks ?? []).filter((m) => m !== 'em' && m !== 'strong'),
    })),
  }))
  if (out.length > 0) {
    const first = out[0].children[0]
    if (first) first.text = first.text.replace(/^\s*[—–-]\s*[“"«‘']?\s*/, '')
    const lastChildren = out[out.length - 1].children
    const last = lastChildren[lastChildren.length - 1]
    if (last) {
      // closing quote right before a trailing stage-direction: `…!” (lacht)` → `…! (lacht)`
      last.text = last.text.replace(/[”"»’]\s*(\([^)]*\))\s*$/, ' $1')
      // plain trailing closing quote
      last.text = last.text.replace(/\s*[”"»’]\s*$/, '')
    }
  }
  return out
}

function transform(body: Block[], subjectKey: string) {
  const firstQ = body.findIndex(isQuestion)
  if (firstQ < 0) return null

  const intro = body.slice(0, firstQ).filter((b) => !isSeparator(b))

  const pairs: unknown[] = []
  const preview: {q: string; a: string; blocks: number}[] = []
  let i = firstQ
  let lastAnswerEnd = firstQ
  while (i < body.length) {
    if (!isQuestion(body[i])) {
      i++
      continue
    }
    const q = body[i]
    let j = i + 1
    const ans: Block[] = []
    while (j < body.length && isAnswer(body[j])) {
      ans.push(body[j])
      j++
    }
    // A question with no contiguous answer is an unsupported shape — abort
    // rather than silently dropping content or emitting a partial qaBlock.
    if (ans.length === 0) {
      throw new Error(`Question with no answer (unsupported shape) — aborting: ${textOf(q).slice(0, 60)}`)
    }
    const question = textOf(q).trim()
    if (question.length > 240) {
      throw new Error(
        `Question exceeds the 240-char schema limit (${question.length}) — aborting: ${question.slice(0, 60)}…`,
      )
    }
    const cleaned = cleanAnswer(ans)
    pairs.push({
      _type: 'qaPair',
      _key: key(),
      question,
      tag: 'standard',
      respondents: [
        {_type: 'qaPairRespondent', _key: key(), respondentKey: subjectKey, answer: cleaned},
      ],
    })
    preview.push({
      q: question,
      a: cleaned.map((b) => b.children.map((c) => c.text).join('')).join(' ⏎ '),
      blocks: ans.length,
    })
    lastAnswerEnd = j
    i = j
  }

  const outro = body.slice(lastAnswerEnd).filter((b) => !isSeparator(b))
  const qaBlock = {_type: 'qaBlock', _key: key(), pairs, groupAtTail: false}
  const newBody = [...intro, qaBlock, ...outro]
  return {newBody, preview, introCount: intro.length, outroCount: outro.length}
}

async function main() {
  for (const id of IDS) {
    const doc = await client.fetch<{
      _id: string
      title: unknown
      body?: Block[]
      subjects?: {_key?: string}[]
    }>(`*[_id == $id][0]{_id, "title": pt::text(title), body, subjects[]{_key}}`, {id})
    if (!doc) {
      console.warn(`\n${id}: NOT FOUND`)
      continue
    }
    // This transform attributes every answer to one subject, so it only makes
    // sense for single-subject interviews — a duo/panel needs per-answer
    // attribution the source prose doesn't carry.
    const subjects = doc.subjects ?? []
    if (subjects.length !== 1) {
      console.warn(
        `\n${doc.title} (${id}): expected exactly 1 subject, found ${subjects.length} — skipped (multi-subject needs manual attribution)`,
      )
      continue
    }
    const subjectKey = subjects[0]?._key
    if (!subjectKey) {
      console.warn(`\n${doc.title} (${id}): subject has no _key — skipped`)
      continue
    }
    const result = transform(doc.body ?? [], subjectKey)
    if (!result) {
      console.log(`\n${doc.title} (${id}): no Q&A detected (already converted?) — skipped`)
      continue
    }
    console.log(`\n########## ${doc.title} ##########`)
    console.log(
      `intro paragraphs: ${result.introCount} | Q&A pairs: ${result.preview.length} | outro paragraphs: ${result.outroCount}`,
    )
    result.preview.forEach((p, n) => {
      const body =
        p.a.length > 260 ? `${p.a.slice(0, 170)}  …[tail]→  ${p.a.slice(-80)}` : p.a
      console.log(`\n  [${n + 1}] Q: ${p.q}`)
      console.log(`      A${p.blocks > 1 ? ` (${p.blocks} paragraphs)` : ''}: ${body}`)
    })
    if (apply) {
      await client.patch(id).set({body: result.newBody}).commit()
      console.log(`\n  ✓ WRITTEN`)
    }
  }
  console.log(apply ? '\nApplied.' : '\nDry run — set APPLY=1 to write.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
