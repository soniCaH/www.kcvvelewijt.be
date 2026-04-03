import {useEffect, useRef, useState} from 'react'
import {type DocumentActionComponent, useClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {buildLinkToPsdMutations} from './build-link-to-psd-mutations'

const API_VERSION = '2024-01-01'

/**
 * "Koppel aan PSD" Document Action.
 *
 * Visible on staffMember documents without a psdId. Accepts a PSD ID,
 * creates a new `staffMember-psd-{psdId}` document with all fields copied,
 * relinks all references, and deletes the old document — in one transaction.
 */
export const LinkToPsdAction: DocumentActionComponent = (props) => {
  const {id, type, published, draft} = props
  // Prefer draft — it contains the latest (possibly unpublished) changes.
  const doc = draft || published
  const client = useClient({apiVersion: API_VERSION})
  const router = useRouter()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [psdId, setPsdId] = useState('')
  const [status, setStatus] = useState<'idle' | 'executing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
    }
  }, [])

  // Only show for staffMember documents without psdId
  if (type !== 'staffMember') return null
  if (doc?.psdId) return null

  const newId = `staffMember-psd-${psdId.trim()}`

  return {
    label: 'Koppel aan PSD',
    disabled: status === 'executing',
    onHandle: () => {
      setDialogOpen(true)
      setStatus('idle')
      setPsdId('')
      setError(null)
    },
    dialog: dialogOpen
      ? {
          type: 'dialog' as const,
          header: 'Koppel aan PSD',
          onClose: () => {
            if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
            setDialogOpen(false)
          },
          content: (
            <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {status === 'done' ? (
                <div>
                  <p>
                    <strong>Migratie voltooid!</strong>
                  </p>
                  <p>
                    Document is verplaatst van <code>{id}</code> naar <code>{newId}</code>.
                  </p>
                  <p>Je kunt dit venster sluiten.</p>
                </div>
              ) : (
                <>
                  <p>
                    Koppel dit stafflid aan een PSD-profiel. Dit maakt een nieuw document aan met
                    het PSD ID-formaat, kopieert alle gegevens, herlinkt alle referenties en
                    verwijdert het oude document.
                  </p>

                  <div>
                    <label htmlFor="psd-id-input">
                      <strong>PSD ID</strong>
                    </label>
                    <input
                      id="psd-id-input"
                      type="text"
                      value={psdId}
                      onChange={(e) => setPsdId(e.target.value)}
                      placeholder="bv. 252"
                      disabled={status === 'executing'}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.5rem',
                        marginTop: '0.25rem',
                        fontSize: '1rem',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                    {psdId.trim() && !/^\d+$/.test(psdId.trim()) && (
                      <p style={{color: 'red', margin: '0.25rem 0 0'}}>
                        PSD ID moet een numerieke waarde zijn.
                      </p>
                    )}
                  </div>

                  {psdId.trim() && (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                      }}
                    >
                      <p style={{margin: 0}}>
                        <strong>Oud ID:</strong> <code>{id}</code>
                      </p>
                      <p style={{margin: 0}}>
                        <strong>Nieuw ID:</strong> <code>{newId}</code>
                      </p>
                    </div>
                  )}

                  {error && (
                    <div style={{color: 'red', padding: '0.5rem'}}>
                      <strong>Fout:</strong> {error}
                    </div>
                  )}

                  <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                    <button
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      disabled={status === 'executing'}
                    >
                      Annuleren
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const trimmedPsdId = psdId.trim()
                        if (!doc || !trimmedPsdId || !/^\d+$/.test(trimmedPsdId)) return

                        setStatus('executing')
                        setError(null)

                        try {
                          const targetId = `staffMember-psd-${trimmedPsdId}`
                          const existing = await client.fetch<{_id: string} | null>(
                            `*[_id == $targetId][0]{_id}`,
                            {targetId},
                          )
                          if (existing) {
                            setStatus('error')
                            setError(
                              `Er bestaat al een document met ID "${targetId}". Kies een ander PSD ID.`,
                            )
                            return
                          }

                          const referencingDocs = await client.fetch<
                            Array<Record<string, unknown>>
                          >(`*[references($docId) && _id != $docId]`, {docId: id})

                          const mutations = buildLinkToPsdMutations({
                            oldDoc: {
                              ...doc,
                              _id: id,
                              _type: 'staffMember' as const,
                            },
                            psdId: trimmedPsdId,
                            referencingDocs: referencingDocs.map((d) => ({
                              ...d,
                              _id: d._id as string,
                              _type: d._type as string,
                            })),
                          })

                          const transaction = client.transaction()
                          for (const mutation of mutations) {
                            if ('create' in mutation) {
                              transaction.create(
                                mutation.create as Parameters<typeof transaction.create>[0],
                              )
                            } else if ('createOrReplace' in mutation) {
                              transaction.createOrReplace(
                                mutation.createOrReplace as Parameters<
                                  typeof transaction.createOrReplace
                                >[0],
                              )
                            } else if ('delete' in mutation) {
                              transaction.delete(mutation.delete.id)
                            }
                          }

                          await transaction.commit({ visibility: 'async' })
                          setStatus('done')

                          // Navigate to the newly created document after a short delay
                          // so the user can see the success message briefly.
                          navTimeoutRef.current = setTimeout(() => {
                            const path = router.resolveIntentLink('edit', {
                              id: targetId,
                              type: 'staffMember',
                            })
                            router.navigateUrl({path})
                          }, 1500)
                        } catch (err) {
                          setStatus('error')
                          setError(err instanceof Error ? err.message : 'Onbekende fout')
                        }
                      }}
                      disabled={!psdId.trim() || !/^\d+$/.test(psdId.trim()) || status === 'executing'}
                      style={{
                        backgroundColor: '#2276fc',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor:
                          /^\d+$/.test(psdId.trim()) && status !== 'executing' ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {status === 'executing' ? 'Bezig met migratie...' : 'Migreer document'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ),
        }
      : undefined,
  }
}

LinkToPsdAction.displayName = 'LinkToPsdAction'
