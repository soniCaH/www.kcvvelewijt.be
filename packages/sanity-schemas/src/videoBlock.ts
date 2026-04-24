import {defineField, defineType} from 'sanity'

/**
 * Phase 1 tracer (#1363) for article-video-support. Single field:
 * `uploadedFile` — a Sanity file asset restricted to MP4/WebM. Renders
 * in `apps/web` as a bare `<video controls src={asset.url}>`.
 *
 * Phases 2–3 will layer on an embed URL, poster, caption, fullBleed and
 * lazy-load controls. Keep this schema minimal until those phases ship —
 * the PRD's explicit "thinnest possible slice" guidance applies.
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
        'Upload een MP4 of WebM (H.264 1080p ~2–3 Mbps aanbevolen). Geen YouTube/Vimeo link — die komt in fase 2.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {
      originalFilename: 'uploadedFile.asset.originalFilename',
      size: 'uploadedFile.asset.size',
    },
    prepare({originalFilename, size}) {
      const title =
        typeof originalFilename === 'string' && originalFilename.length > 0
          ? originalFilename
          : 'Video (geen bestand geüpload)'
      const subtitle =
        typeof size === 'number' && size > 0
          ? `Video — ${(size / 1024 / 1024).toFixed(1)} MB`
          : 'Video'
      return {title, subtitle}
    },
  },
})
