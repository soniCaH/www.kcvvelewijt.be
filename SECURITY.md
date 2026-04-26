# Security Policy

## Image Security

### SVG Handling

**Current Status (2026-04-26):**

- `dangerouslyAllowSVG: true` is enabled in `next.config.ts`
- **Current Risk: LOW** — No user-uploaded SVGs are accepted
- Sanity CMS serves common image formats (JPEG, PNG, GIF, WebP) via Cloudflare CDN
- Local SVG files (`public/images/footer-top.svg`) are controlled by developers

**Security Measures:**

1. ✅ `contentDispositionType: 'attachment'` — Forces download instead of inline display
2. ✅ Limited to specific remote patterns (placehold.co, cdn.sanity.io, Cloudflare CDN)
3. ✅ Runtime MIME type validation — Schema enforces image MIME types (JPEG/PNG/GIF/WebP only, no SVG)
4. ✅ Automated test coverage — Tests verify PDF/SVG files are rejected at schema level

### File Upload Security — Defense in Depth

**⚠️ CRITICAL: MIME Type Validation Alone is INSUFFICIENT!**

Our file validation uses a **defense-in-depth approach** with multiple security layers. MIME types can be easily spoofed by attackers, so we implement validation at multiple levels:

#### Layer 1: Schema Validation (Frontend/Runtime)

- **Location:** `apps/web/src/lib/effect/schemas/file.schema.ts`
- **Purpose:** Type safety and basic MIME type filtering
- **Validates:** Accepts only `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **⚠️ Limitation:** This is NOT a security control — it's defense-in-depth and type safety

#### Layer 2: Sanity CMS Server-Side Validation (PRIMARY SECURITY CONTROL)

Sanity performs server-side validation on all file uploads:

1. **MIME type enforcement** — Sanity restricts accepted file types at the field level
2. **CDN delivery** — Images are served via Cloudflare CDN from `cdn.sanity.io`
3. **No arbitrary file execution** — Assets are served as static files, not executed

#### Layer 3: Next.js Image Optimization

- **Location:** `next.config.ts` `remotePatterns`
- **Purpose:** Restrict which domains can serve images
- **Current allowed domains:** placehold.co, cdn.sanity.io, Cloudflare CDN
- Any image from unapproved domains will be rejected

#### Testing File Validation

```bash
# Run schema validation tests
pnpm --filter @kcvv/web test file.schema.test.ts
```

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

- **Date:** 2026-04-26
- **Reviewer:** Kevin Van Ransbeeck
- **Status:** ✅ Safe — No user-uploaded SVGs; fully migrated to Sanity + Cloudflare CDN
