import {randomBytes, randomUUID} from 'node:crypto'
import {getCliClient} from 'sanity/cli'

/**
 * Migrate a legacy Drupal article node into a Sanity `article` DRAFT.
 *
 * Fetches the node over JSON:API, converts its `<p>/<strong>/<em>/<br>` body
 * to Portable Text, uploads the cover image, resolves the interview subject
 * (leading "Firstname Lastname:" in the title → Sanity player/staff), and
 * runs the same strong-Q / em-A → `qaBlock` transform used for the in-place
 * seed conversions. Creates a `drafts.` document so it can be reviewed and
 * published in Studio rather than going live unreviewed.
 *
 * Dry-run by default. Set APPLY=1 to upload the image and create the draft.
 *
 *   cd apps/studio
 *   NID=1125 npx sanity exec scripts/migrate-drupal-node.ts --with-user-token
 *   APPLY=1 NID=1125 npx sanity exec scripts/migrate-drupal-node.ts --with-user-token
 */

const NID = process.env.NID ?? '1125'
const apply = process.env.APPLY === '1'
const DRUPAL = 'https://api.kcvvelewijt.be'
const client = getCliClient()
const key = () => randomBytes(6).toString('hex')

// ── HTML → Portable Text (regular Drupal body only) ────────────────────────
type Span = {_type: string; _key: string; text: string; marks: string[]}
type Block = {_type: string; _key: string; style: string; markDefs: unknown[]; children: Span[]}

const decode = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // `&amp;` MUST be unescaped after the other entities: doing it earlier lets
    // the produced `&` re-form a following entity (`&amp;lt;` → `&lt;` → `<`),
    // a double-unescape. Placing it here means its output can't be re-consumed.
    .replace(/&amp;/g, '&')
    .replace(/ /g, ' ')

// Strip tags to a fixpoint: a single pass can be circumvented by nesting
// (`<scr<script>ipt>` → one pass leaves `<script>`), so repeat until stable.
const stripTags = (s: string): string => {
  let prev: string
  let out = s
  do {
    prev = out
    out = out.replace(/<[^>]*>/g, '')
  } while (out !== prev)
  return out
}

// Assumes the regular Drupal interview shape: each <p> is a single logical unit
// — question (wholly <strong>), answer (wholly <em>), or plain prose. Marks are
// applied per paragraph, not per inline run; `em` wins over `strong` so an
// em+strong answer-continuation is still classified as an answer. Genuinely
// mixed inline content (bold + italic in one paragraph) is out of scope for
// these bodies and would be flattened — check the dry-run before trusting a new
// source.
function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = []
  for (const seg of html.split(/<\/p>/i)) {
    const m = seg.match(/<p[^>]*>([\s\S]*)$/i)
    if (!m) continue
    const inner = m[1]
    const hasEm = /<em\b/i.test(inner)
    const hasStrong = /<strong\b/i.test(inner)
    const text = decode(stripTags(inner)).replace(/\r/g, '').trim()
    if (!text) continue
    const marks = hasEm ? ['em'] : hasStrong ? ['strong'] : []
    blocks.push({
      _type: 'block',
      _key: key(),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: key(), text, marks}],
    })
  }
  return blocks
}

// ── strong-Q / em-A → qaBlock (mirror of seed-interview-qa-pairs) ───────────
const textOf = (b: Block) => b.children.map((c) => c.text).join('')
const hasMark = (b: Block, m: string) => b.children.some((c) => c.marks.includes(m))
const isQuestion = (b: Block) => hasMark(b, 'strong') && !hasMark(b, 'em') && textOf(b).trim().endsWith('?')
const isAnswer = (b: Block) => hasMark(b, 'em')
const isSeparator = (b: Block) => {
  const t = textOf(b).trim()
  return t === '' || /^[—–-]{1,3}$/.test(t)
}

function cleanAnswer(blocks: Block[]): Block[] {
  const out = blocks.map((b) => ({
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [] as unknown[],
    children: b.children.map((c) => ({
      _type: 'span',
      _key: key(),
      text: c.text,
      marks: c.marks.filter((m) => m !== 'em' && m !== 'strong'),
    })),
  }))
  if (out.length > 0) {
    const first = out[0].children[0]
    if (first) first.text = first.text.replace(/^\s*[—–-]\s*[“"«‘']?\s*/, '')
    const lastCh = out[out.length - 1].children
    const last = lastCh[lastCh.length - 1]
    if (last) {
      last.text = last.text.replace(/[”"»’]\s*(\([^)]*\))\s*$/, ' $1')
      last.text = last.text.replace(/\s*[”"»’]\s*$/, '')
    }
  }
  return out
}

function toQaBody(body: Block[], subjectKey: string | undefined) {
  const firstQ = body.findIndex(isQuestion)
  if (firstQ < 0) return {body, pairs: 0}
  const intro = body.slice(0, firstQ).filter((b) => !isSeparator(b))
  const pairs: unknown[] = []
  let i = firstQ
  let lastEnd = firstQ
  while (i < body.length) {
    if (!isQuestion(body[i])) {
      i++
      continue
    }
    const q = body[i]
    let j = i + 1
    const ans: Block[] = []
    // Skip separators between question and answer while collecting; stop at the
    // next question or at plain prose (outro).
    while (j < body.length && (isAnswer(body[j]) || isSeparator(body[j]))) {
      if (isAnswer(body[j])) ans.push(body[j])
      j++
    }
    if (ans.length > 0) {
      const question = textOf(q).trim()
      if (question.length > 240) {
        console.warn(`  ! question exceeds 240-char schema limit (${question.length}) — will fail validation: ${question.slice(0, 60)}…`)
      }
      pairs.push({
        _type: 'qaPair',
        _key: key(),
        question,
        tag: 'standard',
        respondents: [
          {
            _type: 'qaPairRespondent',
            _key: key(),
            // Only attribute when a subject was resolved; otherwise leave the
            // key unset so it can never dangle against a missing subjects[].
            ...(subjectKey ? {respondentKey: subjectKey} : {}),
            answer: cleanAnswer(ans),
          },
        ],
      })
      lastEnd = j
    }
    i = j
  }
  const outro = body.slice(lastEnd).filter((b) => !isSeparator(b))
  // Never emit an empty qaBlock — if no pairs were built, return the prose as-is.
  const qaBlocks = pairs.length > 0 ? [{_type: 'qaBlock', _key: key(), pairs, groupAtTail: false}] : []
  return {body: [...intro, ...qaBlocks, ...outro], pairs: pairs.length}
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function main() {
  const url = `${DRUPAL}/jsonapi/node/article?filter%5Bdrupal_internal__nid%5D=${NID}&include=field_media_article_image.field_media_image,field_tags`
  const res = await fetch(url, {headers: {Accept: 'application/vnd.api+json'}})
  if (!res.ok) throw new Error(`Drupal JSON:API returned HTTP ${res.status} for node ${NID}`)
  const json = (await res.json()) as any
  const node = json.data?.[0]
  if (!node) throw new Error(`Drupal node ${NID} not found`)
  const a = node.attributes

  const title: string = a.title
  const lead: string = a.body?.summary ?? ''
  const publishedAt: string = a.created
  const featured = Boolean(a.field_featured ?? a.promote)
  const slug = slugify(title.replace(/[:"“”].*$/, '') + ' ' + title.replace(/^[^:]*:/, ''))
  const coverFile = (json.included ?? []).find((x: any) => x.type === 'file--file')
  const coverUrl = coverFile ? DRUPAL + coverFile.attributes.uri.url : null
  const tagTerms = (json.included ?? [])
    .filter((x: any) => x.type?.startsWith('taxonomy_term'))
    .map((x: any) => x.attributes?.name)
    .filter(Boolean)

  // Subject: "Firstname Lastname: …" → Sanity player/staff.
  const leadName = title.split(':')[0].trim()
  const [firstName, ...rest] = leadName.split(/\s+/)
  const lastName = rest.join(' ')
  const person = await client.fetch<{_id: string; _type: string; firstName?: string; lastName?: string} | null>(
    `*[_type in ["player","staffMember"] && firstName == $f && lastName == $l][0]{_id,_type,firstName,lastName}`,
    {f: firstName, l: lastName},
  )

  const rawBlocks = htmlToBlocks(a.body?.value ?? '')
  // Only mint a subject key (and thus a respondentKey) when the subject was
  // resolved — keeps subjects[]._key and respondentKey aligned.
  const subjectKey = person ? key() : undefined
  const {body, pairs} = toQaBody(rawBlocks, subjectKey)

  console.log('\n========== MIGRATE DRUPAL NODE ' + NID + ' ==========')
  console.log('title      :', title)
  console.log('slug       : /nieuws/' + slug)
  console.log('lead       :', lead)
  console.log('publishedAt:', publishedAt, '| featured:', featured)
  console.log('cover      :', coverUrl)
  console.log('tags       :', tagTerms.join(', ') || '(none)')
  console.log(
    'subject    :',
    person ? `${person.firstName} ${person.lastName} (${person._type} ${person._id})` : `NOT FOUND for "${leadName}"`,
  )
  console.log('body       :', pairs, 'Q&A pairs +', body.length - 1, 'prose block(s)')

  if (!person) {
    console.warn('\n! Subject not resolved — set it manually in Studio (interview requires a subject).')
  }

  if (!apply) {
    const qa = body.find((b: any) => b._type === 'qaBlock') as any
    ;(qa?.pairs ?? []).forEach((p: any, n: number) => {
      const ans = p.respondents[0].answer.map((bl: any) => bl.children.map((c: any) => c.text).join('')).join(' ⏎ ')
      console.log(`\n  [${n + 1}] Q: ${p.question}`)
      console.log(`      A: ${ans.length > 200 ? ans.slice(0, 140) + ' …→ ' + ans.slice(-55) : ans}`)
    })
    console.log('\nDry run — set APPLY=1 to upload the cover + create the DRAFT.')
    return
  }

  let coverImage: unknown
  if (coverUrl) {
    const imgRes = await fetch(coverUrl)
    if (!imgRes.ok) throw new Error(`Cover image fetch returned HTTP ${imgRes.status} for ${coverUrl}`)
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const asset = await client.assets.upload('image', buf, {filename: coverUrl.split('/').pop()})
    coverImage = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}
    console.log('uploaded cover asset:', asset._id)
  }

  const doc: Record<string, unknown> = {
    _id: `drafts.${randomUUID()}`,
    _type: 'article',
    articleType: 'interview',
    title: [{_type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: key(), text: title, marks: []}]}],
    slug: {_type: 'slug', current: slug},
    lead,
    publishedAt,
    featured,
    ...(tagTerms.length ? {tags: tagTerms} : {}),
    ...(person
      ? {
          subjects: [
            person._type === 'player'
              ? {_type: 'subject', _key: subjectKey, kind: 'player', playerRef: {_type: 'reference', _ref: person._id}}
              : {_type: 'subject', _key: subjectKey, kind: 'staff', staffRef: {_type: 'reference', _ref: person._id}},
          ],
        }
      : {}),
    ...(coverImage ? {coverImage} : {}),
    body,
  }

  const created = await client.create(doc as any)
  console.log('\n✓ Created draft:', created._id)
  console.log('  Review & publish in Studio.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
