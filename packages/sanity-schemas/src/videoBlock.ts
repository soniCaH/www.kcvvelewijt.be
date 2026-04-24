import {defineField, defineType} from 'sanity'

/**
 * Allowed hosts for `embedUrl` — locked to YouTube + Vimeo per the
 * article-video-support PRD. Expanding the list requires updating the
 * parser (`parseEmbedUrl`), iframe allow-list on the serializer, and
 * any relevant CSP; don't add hosts ad-hoc without the parser work.
 */
const ALLOWED_EMBED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'www.vimeo.com',
])

// Matches `https://<host>[/...]` where <host> is any valid hostname.
// Deliberately avoids `new URL()` so the schema package can stay on the
// ES2017 lib without pulling in the DOM types.
const HTTPS_URL_RE = /^https:\/\/([^/?#]+)(?:[/?#]|$)/i

function isAllowedEmbedUrl(raw: string): boolean {
  const match = HTTPS_URL_RE.exec(raw)
  if (!match) return false
  return ALLOWED_EMBED_HOSTS.has(match[1].toLowerCase())
}

function extractHost(raw: string): string | null {
  const match = HTTPS_URL_RE.exec(raw)
  return match ? match[1].toLowerCase() : null
}

/**
 * Phase 1 tracer (#1363) introduced `uploadedFile`. Phase 2 (#1364) adds
 * the `embedUrl` escape hatch for YouTube/Vimeo links — exactly one of
 * the two must be set, enforced via a Rule.custom on the object. The
 * preview falls back to whichever is populated. Phase 3 will layer on
 * poster/caption/lazy-load/fullBleed.
 */
export const videoBlock = defineType({
  name: 'videoBlock',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'uploadedFile',
      title: 'Video file',
      type: 'file',
      options: {
        accept: 'video/mp4,video/webm',
      },
      description:
        'Upload een MP4 of WebM (H.264 1080p ~2–3 Mbps aanbevolen). Gebruik dit OF "Embed URL" — niet beide.',
    }),
    defineField({
      name: 'embedUrl',
      title: 'Embed URL',
      type: 'url',
      description:
        'Plak een YouTube of Vimeo link. Gebruik dit OF "Video file" — niet beide. Toegestaan: youtube.com, youtu.be, vimeo.com (altijd https).',
      validation: (r) =>
        r.uri({
          scheme: ['https'],
          allowRelative: false,
        }).custom((value) => {
          if (typeof value !== 'string' || value.length === 0) return true
          return isAllowedEmbedUrl(value)
            ? true
            : 'Alleen YouTube of Vimeo links zijn toegestaan (https://youtube.com, https://youtu.be, https://vimeo.com).'
        }),
    }),
  ],
  // Object-level XOR: exactly one of uploadedFile / embedUrl must be set.
  // Ran as a Rule.custom on the parent object so the error surfaces on
  // the block as a whole rather than on either field individually.
  validation: (r) =>
    r.custom((value) => {
      const parent = value as
        | {uploadedFile?: unknown; embedUrl?: unknown}
        | undefined
      const hasUpload =
        !!parent?.uploadedFile &&
        typeof parent.uploadedFile === 'object' &&
        (parent.uploadedFile as {asset?: unknown}).asset != null
      const hasEmbed =
        typeof parent?.embedUrl === 'string' && parent.embedUrl.length > 0
      if (hasUpload && hasEmbed) {
        return 'Upload een bestand of plak een embed-URL — niet allebei.'
      }
      if (!hasUpload && !hasEmbed) {
        return 'Upload een bestand of plak een embed-URL.'
      }
      return true
    }),
  preview: {
    select: {
      originalFilename: 'uploadedFile.asset.originalFilename',
      size: 'uploadedFile.asset.size',
      embedUrl: 'embedUrl',
    },
    prepare({originalFilename, size, embedUrl}) {
      if (typeof embedUrl === 'string' && embedUrl.length > 0) {
        const host = (extractHost(embedUrl) ?? 'embed').replace(/^www\./, '')
        return {title: embedUrl, subtitle: `Video — embed (${host})`}
      }
      const title =
        typeof originalFilename === 'string' && originalFilename.length > 0
          ? originalFilename
          : 'Video (geen bestand geüpload)'
      const subtitle =
        typeof size === 'number' && size > 0
          ? `Video — upload · ${(size / 1024 / 1024).toFixed(1)} MB`
          : 'Video — upload'
      return {title, subtitle}
    },
  },
})
