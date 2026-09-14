import {at, set} from 'sanity/migrate'
import {describe, expect, it} from 'vitest'
import {
  assertPlayerRowsNonEmpty,
  migrateRepointLegacyPlayerLinks,
  resolvePlayerPsdId,
  rewritePlayerLinksInBlock,
  rewritePlayerLinksInHtml,
  type ArticleOrPageDoc,
  type PlayerRow,
  type PortableTextBlockLike,
} from './repoint-legacy-player-links'

const ROWS: PlayerRow[] = [
  {psdId: '1673', firstName: 'Maxim', lastName: 'Breugelmans'},
  {psdId: '1674', firstName: 'Gregory', lastName: 'Boudart'},
]

describe('resolvePlayerPsdId', () => {
  it('resolves a name-slug to the matching psdId', () => {
    expect(resolvePlayerPsdId('maxim-breugelmans', ROWS)).toBe('1673')
  })

  it('is case-insensitive', () => {
    expect(resolvePlayerPsdId('MAXIM-BREUGELMANS', ROWS)).toBe('1673')
  })

  it('returns null for a slug with no matching player (dead link)', () => {
    expect(resolvePlayerPsdId('denis-ghys', ROWS)).toBeNull()
  })

  it('falls back to treating the slug as a psdId directly', () => {
    expect(resolvePlayerPsdId('1673', ROWS)).toBe('1673')
  })
})

describe('assertPlayerRowsNonEmpty', () => {
  it('throws when the player-rows query came back empty — refusing to run rather than strip every link', () => {
    expect(() => assertPlayerRowsNonEmpty([])).toThrow(/zero rows/i)
  })

  it('names what to check in the thrown message: dataset/project flags and the PSD sync', () => {
    expect(() => assertPlayerRowsNonEmpty([])).toThrow(/--dataset/)
    expect(() => assertPlayerRowsNonEmpty([])).toThrow(/psd sync/i)
  })

  it('does not throw when at least one player row is present', () => {
    expect(() => assertPlayerRowsNonEmpty(ROWS)).not.toThrow()
  })
})

describe('rewritePlayerLinksInHtml', () => {
  it('rewrites a resolvable /player/ anchor to a relative /spelers/<psdId> href', () => {
    const html =
      '<td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans">Maxim Breugelmans</a></td>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(true)
    expect(result.html).toBe(
      '<td><a href="/spelers/1673">Maxim Breugelmans</a></td>',
    )
  })

  it('unwraps an unresolvable /player/ anchor, keeping only its text', () => {
    const html =
      '<td><a href="https://www.kcvvelewijt.be/player/denis-ghys">Denis Ghys</a></td>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(true)
    expect(result.html).toBe('<td>Denis Ghys</td>')
  })

  it('tolerates a trailing slash on the stored href', () => {
    const html =
      '<td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans/">Maxim Breugelmans</a></td>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(true)
    expect(result.html).toBe(
      '<td><a href="/spelers/1673">Maxim Breugelmans</a></td>',
    )
  })

  it('leaves a non-player anchor (Facebook permalink) untouched', () => {
    const html =
      '<td><a href="https://www.facebook.com/KCVVElewijt/posts/1" target="_blank">Facebook</a></td>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(false)
    expect(result.html).toBe(html)
  })

  it('reports no change on html with no /player/ anchor at all', () => {
    const html = '<td>Geen link</td>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(false)
    expect(result.html).toBe(html)
  })

  it('rewrites multiple anchors in one row — resolved and dead side by side', () => {
    const html =
      '<tr>' +
      '<td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans">Maxim Breugelmans</a></td>' +
      '<td><a href="https://www.kcvvelewijt.be/player/denis-ghys">Denis Ghys</a></td>' +
      '<td><a href="https://www.facebook.com/KCVVElewijt/posts/1" target="_blank">Facebook</a></td>' +
      '</tr>'
    const result = rewritePlayerLinksInHtml(html, ROWS)
    expect(result.changed).toBe(true)
    expect(result.html).toBe(
      '<tr>' +
        '<td><a href="/spelers/1673">Maxim Breugelmans</a></td>' +
        '<td>Denis Ghys</td>' +
        '<td><a href="https://www.facebook.com/KCVVElewijt/posts/1" target="_blank">Facebook</a></td>' +
        '</tr>',
    )
  })
})

function playerMarkDef(key: string, href: string) {
  return {_type: 'link', _key: key, href}
}

describe('rewritePlayerLinksInBlock', () => {
  it('rewrites a resolvable link markDef href to a relative /spelers/<psdId>, keeping the mark', () => {
    const block: PortableTextBlockLike = {
      _type: 'block',
      children: [
        {_type: 'span', _key: 's1', text: 'Maxim Breugelmans', marks: ['lk']},
      ],
      markDefs: [
        playerMarkDef(
          'lk',
          'https://www.kcvvelewijt.be/player/maxim-breugelmans',
        ),
      ],
    }
    const result = rewritePlayerLinksInBlock(block, ROWS)
    expect(result.changed).toBe(true)
    expect(result.block.markDefs).toEqual([{_type: 'link', _key: 'lk', href: '/spelers/1673'}])
    expect(result.block.children).toEqual([
      {_type: 'span', _key: 's1', text: 'Maxim Breugelmans', marks: ['lk']},
    ])
  })

  it('drops an unresolvable link markDef and its key from the span, keeping the text', () => {
    const block: PortableTextBlockLike = {
      _type: 'block',
      children: [
        {_type: 'span', _key: 's1', text: 'Denis Ghys', marks: ['lk']},
      ],
      markDefs: [
        playerMarkDef('lk', 'https://www.kcvvelewijt.be/player/denis-ghys'),
      ],
    }
    const result = rewritePlayerLinksInBlock(block, ROWS)
    expect(result.changed).toBe(true)
    expect(result.block.markDefs).toEqual([])
    expect(result.block.children).toEqual([
      {_type: 'span', _key: 's1', text: 'Denis Ghys', marks: []},
    ])
  })

  it('leaves a non-player link markDef (Facebook) untouched', () => {
    const block: PortableTextBlockLike = {
      _type: 'block',
      children: [{_type: 'span', _key: 's1', text: 'facebook', marks: ['lk']}],
      markDefs: [
        {
          _type: 'link',
          _key: 'lk',
          href: 'https://www.facebook.com/KCVVElewijt/photos/1',
        },
      ],
    }
    const result = rewritePlayerLinksInBlock(block, ROWS)
    expect(result.changed).toBe(false)
    expect(result.block).toBe(block)
  })

  it('reports no change on a block with no markDefs', () => {
    const block: PortableTextBlockLike = {
      _type: 'block',
      children: [{_type: 'span', _key: 's1', text: 'Plain text', marks: []}],
      markDefs: [],
    }
    const result = rewritePlayerLinksInBlock(block, ROWS)
    expect(result.changed).toBe(false)
    expect(result.block).toBe(block)
  })

  it('only unwraps the mark on spans that actually carry it, leaving other marks alone', () => {
    const block: PortableTextBlockLike = {
      _type: 'block',
      children: [
        {_type: 'span', _key: 's1', text: 'Denis Ghys', marks: ['lk', 'accent']},
        {_type: 'span', _key: 's2', text: ' is weg', marks: []},
      ],
      markDefs: [
        playerMarkDef('lk', 'https://www.kcvvelewijt.be/player/denis-ghys'),
      ],
    }
    const result = rewritePlayerLinksInBlock(block, ROWS)
    expect(result.block.children).toEqual([
      {_type: 'span', _key: 's1', text: 'Denis Ghys', marks: ['accent']},
      {_type: 'span', _key: 's2', text: ' is weg', marks: []},
    ])
  })
})

function htmlTableDoc(html: string): ArticleOrPageDoc {
  return {
    _type: 'article',
    body: [{_type: 'htmlTable', _key: 'tbl1', html}],
  }
}

describe('migrateRepointLegacyPlayerLinks', () => {
  it('patches body when an htmlTable block has a resolvable /player/ link', () => {
    const doc = htmlTableDoc(
      '<table><tr><td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans">Maxim Breugelmans</a></td></tr></table>',
    )
    const patch = migrateRepointLegacyPlayerLinks(doc, ROWS)
    expect(patch).toEqual([
      at(
        'body',
        set([
          {
            _type: 'htmlTable',
            _key: 'tbl1',
            html: '<table><tr><td><a href="/spelers/1673">Maxim Breugelmans</a></td></tr></table>',
          },
        ]),
      ),
    ])
  })

  it('patches body when an htmlTable block has an unresolvable /player/ link', () => {
    const doc = htmlTableDoc(
      '<table><tr><td><a href="https://www.kcvvelewijt.be/player/denis-ghys">Denis Ghys</a></td></tr></table>',
    )
    const patch = migrateRepointLegacyPlayerLinks(doc, ROWS)
    expect(patch).toEqual([
      at(
        'body',
        set([
          {
            _type: 'htmlTable',
            _key: 'tbl1',
            html: '<table><tr><td>Denis Ghys</td></tr></table>',
          },
        ]),
      ),
    ])
  })

  it('resolves a trailing-slash /player/ href the same as one without', () => {
    const doc = htmlTableDoc(
      '<table><tr><td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans/">Maxim Breugelmans</a></td></tr></table>',
    )
    const patch = migrateRepointLegacyPlayerLinks(doc, ROWS)
    expect(patch?.[0]).toEqual(
      at(
        'body',
        set([
          {
            _type: 'htmlTable',
            _key: 'tbl1',
            html: '<table><tr><td><a href="/spelers/1673">Maxim Breugelmans</a></td></tr></table>',
          },
        ]),
      ),
    )
  })

  it('produces no patch for a document with no /player/ link anywhere', () => {
    const doc: ArticleOrPageDoc = {
      _type: 'article',
      body: [
        {
          _type: 'block',
          _key: 'b1',
          children: [{_type: 'span', _key: 's1', text: 'Gewoon tekst', marks: []}],
          markDefs: [],
        },
        {
          _type: 'htmlTable',
          _key: 'tbl1',
          html: '<table><tr><td><a href="https://www.facebook.com/x" target="_blank">Facebook</a></td></tr></table>',
        },
      ],
    }
    expect(migrateRepointLegacyPlayerLinks(doc, ROWS)).toBeUndefined()
  })

  it('produces no patch for a document with no body field', () => {
    expect(migrateRepointLegacyPlayerLinks({_type: 'page'}, ROWS)).toBeUndefined()
  })

  it('is idempotent — running the transform on its own output produces no patch', () => {
    const doc = htmlTableDoc(
      '<table><tr><td><a href="https://www.kcvvelewijt.be/player/maxim-breugelmans">Maxim Breugelmans</a></td>' +
        '<td><a href="https://www.kcvvelewijt.be/player/denis-ghys">Denis Ghys</a></td></tr></table>',
    )
    const firstPatch = migrateRepointLegacyPlayerLinks(doc, ROWS)
    expect(firstPatch).toBeDefined()

    // Apply the patch by hand (`at(path, set(value))` shape:
    // `{ path, op: { type: 'set', value } }`) and re-run — the second pass
    // must see nothing left to fix.
    const nextBody = (
      firstPatch![0] as unknown as {op: {value: unknown}}
    ).op.value
    const migratedDoc: ArticleOrPageDoc = {
      ...doc,
      body: nextBody as ArticleOrPageDoc['body'],
    }
    expect(migrateRepointLegacyPlayerLinks(migratedDoc, ROWS)).toBeUndefined()
  })

  it('repoints both a portable text link mark and an htmlTable anchor in the same document', () => {
    const doc: ArticleOrPageDoc = {
      _type: 'article',
      body: [
        {
          _type: 'block',
          _key: 'b1',
          children: [
            {_type: 'span', _key: 's1', text: 'Maxim Breugelmans', marks: ['lk']},
          ],
          markDefs: [
            playerMarkDef(
              'lk',
              'https://www.kcvvelewijt.be/player/maxim-breugelmans',
            ),
          ],
        },
        {
          _type: 'htmlTable',
          _key: 'tbl1',
          html: '<table><tr><td><a href="https://www.kcvvelewijt.be/player/denis-ghys">Denis Ghys</a></td></tr></table>',
        },
      ],
    }
    const patch = migrateRepointLegacyPlayerLinks(doc, ROWS)
    expect(patch).toBeDefined()
    const nextBody = (patch![0] as unknown as {op: {value: unknown[]}}).op
      .value
    expect(nextBody[0]).toMatchObject({
      markDefs: [{_type: 'link', _key: 'lk', href: '/spelers/1673'}],
    })
    expect(nextBody[1]).toMatchObject({
      html: '<table><tr><td>Denis Ghys</td></tr></table>',
    })
  })
})
