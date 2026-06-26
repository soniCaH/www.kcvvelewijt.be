# Security Policy

## Image Security

### SVG Handling

**Current Status (2026-06-26):**

- `dangerouslyAllowSVG: true` is enabled in `next.config.ts`
- **Current Risk: LOW** — No user-uploaded SVGs are accepted
- Sanity CMS serves common image formats (JPEG, PNG, GIF, WebP) via Cloudflare CDN
- Local SVG files (`public/images/footer-top.svg`) are controlled by developers

**Security Measures:**

1. ✅ `contentDispositionType: 'attachment'` — Forces download instead of inline display
2. ✅ Limited to the image hosts allowlisted in `next.config.ts` `remotePatterns`
3. ✅ No user uploads — all images are author-controlled via Sanity; the public site has no upload endpoint
4. ✅ Static asset delivery — Sanity serves uploaded media as static files via `cdn.sanity.io` (no execution)

### File Upload Security

**The public site accepts no user file uploads** — all images are author-controlled in
Sanity and served as static assets, so there is no client-facing upload surface to guard.
There is intentionally **no app-level MIME schema** in the web app; the controls below apply
to author-uploaded media. If a user-facing upload surface is ever added, implement runtime
MIME validation and the SVG hardening below before shipping it.

#### Sanity CMS server-side validation (primary control)

1. **Field-level restrictions** — Sanity processes and restricts uploaded assets server-side
2. **CDN delivery** — assets are served as static files from `cdn.sanity.io`
3. **No arbitrary file execution** — assets are static, never executed

#### Next.js Image remote allowlist

- **Location:** `next.config.ts` `remotePatterns`
- **Purpose:** restrict which domains can serve images
- **Allowed hosts:** the `remotePatterns` allowlist in `next.config.ts` — images from any other host are rejected

---

**⚠️ IMPORTANT — Before Adding User-Uploaded SVGs:**

If you plan to allow users to upload SVG files in the future, you **MUST** implement these additional security measures:

#### 1. Server-Side SVG Sanitization

```typescript
// Install: pnpm add isomorphic-dompurify
import DOMPurify from "isomorphic-dompurify";

function sanitizeSVG(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["use"],
    FORBID_TAGS: ["script", "foreignObject", "iframe", "embed", "object"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}
```

#### 2. Upload Validation

- Validate MIME type: Only accept `image/svg+xml`
- Check file extension: Only `.svg`
- Scan for dangerous patterns:
  - `<script>` tags
  - `javascript:` URLs
  - Event handlers (`onclick`, `onload`, etc.)
  - `<foreignObject>` tags
  - External references

#### 3. Content Security Policy (CSP)

Use Next.js middleware to generate a per-request cryptographically random nonce
and attach it to the CSP header. **Do not set a static nonce** — the nonce must
be unique per response or it provides no XSS protection.

See the Next.js docs for the canonical pattern:
https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

The middleware generates a nonce, passes it to the response header, and uses it
to allowlist inline scripts/styles:

```typescript
// middleware.ts (simplified shape — adapt to your nonce generation)
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  `style-src 'self' 'nonce-${nonce}'`,
  "img-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");
```

**Note:** Avoid `'unsafe-inline'` or `'unsafe-eval'` — they negate XSS protection.

## Reporting Security Issues

If you discover a security vulnerability, please email: kevin@kcvvelewijt.be

**Do NOT create a public GitHub issue for security vulnerabilities.**

## Security Checklist for Developers

### Before Deploying Changes

- [ ] No user-uploaded SVGs without sanitization
- [ ] All remote image domains are explicitly listed in `remotePatterns`
- [ ] No inline `data:` URIs from untrusted sources
- [ ] CSP headers configured if serving user content
- [ ] Dependencies updated (`pnpm audit`)

### Regular Security Maintenance

- [ ] Monthly: Run `pnpm audit` and update vulnerable dependencies
- [ ] Quarterly: Review Sanity media library file type settings
- [ ] Annually: Security audit of image handling pipeline

## Dependencies with Security Implications

| Package      | Purpose            | Security Notes                             |
| ------------ | ------------------ | ------------------------------------------ |
| `next/image` | Image optimization | Trusted — Official Next.js package         |
| `effect`     | Data validation    | Schema validation prevents malformed data  |
| None yet     | SVG Sanitization   | **Required if user SVG uploads are added** |

## Last Security Review

- **Date:** 2026-06-26
- **Reviewer:** Kevin Van Ransbeeck
- **Status:** ✅ Safe — No user-uploaded SVGs; fully migrated to Sanity + Cloudflare CDN
