import {useState} from 'react'
import {type DocumentActionComponent, useClient} from 'sanity'
import {
  buildRemovePsdImageMutations,
  collectPsdImageAssetIds,
  isRemovePsdImageVisible,
} from './build-remove-psd-image-mutations'

const API_VERSION = '2024-01-01'

type Status = 'idle' | 'executing' | 'done' | 'kept' | 'error'

/**
 * "Verwijder PSD-foto" Document Action (#3703).
 *
 * Visible on player and staffMember documents that carry a `psdImage`. Unsets
 * `psdImage` + `psdImageUrl` on the published document and the open draft, then
 * deletes the old asset only when no document (draft included) still references
 * it — the same rule as `deleteAssetIfUnreferenced` in the BFF. Makes no PSD calls.
 */
export const RemovePsdImageAction: DocumentActionComponent = (props) => {
  const {id, type, published, draft} = props
  const client = useClient({apiVersion: API_VERSION})

  const [dialogOpen, setDialogOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!isRemovePsdImageVisible({type, dialogOpen, draft, published})) return null

  const run = async () => {
    setStatus('executing')
    setError(null)
    try {
      const assetIds = collectPsdImageAssetIds(draft, published)
      const transaction = client.transaction()
      for (const {patch} of buildRemovePsdImageMutations({id, draft, published})) {
        transaction.patch(patch.id, {unset: patch.unset})
      }
      await transaction.commit()

      // A failed delete must not undo the unset above.
      try {
        for (const assetId of assetIds) {
          // `raw`: the default perspective would not count a draft-only reference.
          const refs = await client.fetch<number>(
            'count(*[references($assetId)])',
            {assetId},
            {perspective: 'raw'},
          )
          if (refs === 0) await client.delete(assetId)
        }
        setStatus('done')
      } catch {
        setStatus('kept')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const finished = status === 'done' || status === 'kept'

  return {
    label: 'Verwijder PSD-foto',
    disabled: status === 'executing',
    onHandle: () => {
      setDialogOpen(true)
      setStatus('idle')
      setError(null)
    },
    dialog: dialogOpen
      ? {
          type: 'dialog' as const,
          header: 'Verwijder PSD-foto',
          onClose: () => setDialogOpen(false),
          content: (
            <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {finished ? (
                <div>
                  <p>
                    <strong>De PSD-foto is verwijderd.</strong>
                  </p>
                  {status === 'kept' && (
                    <p>Het bestand zelf is bewaard: het kon niet worden opgeruimd.</p>
                  )}
                  <p>Je kunt dit venster sluiten.</p>
                </div>
              ) : (
                <>
                  <p>
                    De PSD-foto wordt meteen verwijderd uit het gepubliceerde document en uit een
                    openstaande draft. Andere velden blijven ongewijzigd. Het bestand wordt enkel
                    opgeruimd als geen enkel ander document het nog gebruikt.
                  </p>

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
                    <button type="button" onClick={run} disabled={status === 'executing'}>
                      {status === 'executing' ? 'Bezig...' : 'Verwijder PSD-foto'}
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

RemovePsdImageAction.displayName = 'RemovePsdImageAction'
