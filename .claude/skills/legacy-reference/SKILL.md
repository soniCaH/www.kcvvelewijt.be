# Legacy Reference — Gatsby & Drupal

Consult only when something in the current codebase needs to be traced back to the original Gatsby implementation or the Drupal JSON:API. Migration is complete — this is archaeology, not active development.

## Gatsby Source Location

Adjacent to this repo on the filesystem. Ask Kevin for the exact path if needed — it is not checked into this repo.

Typical pattern when tracing legacy behavior:

1. Find the original Gatsby page in `src/pages/` or `src/templates/`
2. Look at the GraphQL query (usually at the bottom of the file, `export const query = graphql\`...\``)
3. Map the GraphQL fields to the Drupal JSON:API field names (they usually match with `field_` prefix)
4. The equivalent is now in Sanity or PSD — check `apps/web/src/lib/repositories/` or `apps/api/src/`

## Drupal JSON:API

- Base: `https://api.kcvvelewijt.be/jsonapi`
- Content types: `node/article`, `node/page`, `node/team`, `node/player`
- Taxonomy: `taxonomy_term/*`
- Fetch a sample: `curl https://api.kcvvelewijt.be/jsonapi/node/article?page[limit]=1 | jq .`

## Field Naming Conventions

| Drupal JSON:API             | Sanity equivalent     |
| --------------------------- | --------------------- |
| `attributes.title`          | `title`               |
| `attributes.field_image`    | `image` (asset ref)   |
| `attributes.body.processed` | `body` (PortableText) |
| `attributes.created`        | `_createdAt`          |
| `relationships.field_*`     | Sanity references     |

## Learnings

<!-- Format: YYYY-MM-DD — what was discovered while tracing legacy code -->
