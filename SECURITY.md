# Security policy

## Reporting

Found a vulnerability? Email **security@codara.app**. Please **do not**
open a public issue. We aim to respond within 48 hours.

## Built-in protections

### Secrets handling

| Secret | Where it lives | Exposed to browser? |
|---|---|---|
| `GEMINI_API_KEY` | `.env.local` (server) | ❌ |
| `GROK_API_KEY` | `.env.local` (server) | ❌ |
| `FIREBASE_ADMIN_SA_BASE64` | `.env.local` (server) | ❌ |
| `NEXT_PUBLIC_FIREBASE_*` | `.env.local` | ✅ (intentional — public web SDK config) |

The server logger redacts any value that looks like a token, key, or JWT.

### HTTP headers (`next.config.mjs`)

- `Content-Security-Policy` — `default-src 'self'`; explicit allowlist for
  Firebase, Gemini, Grok, GitHub.
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denies camera/mic/geolocation.
- `X-Powered-By` removed.

### Authentication & authorization

- Auth via **Firebase Auth** (Google / Email-Password).
- Every protected `/api/*` route calls `requireUser(req)` which verifies the
  Firebase ID token using **Firebase Admin SDK** (server-side).
- Premium routes additionally call `requirePremium(user)` — the user's plan
  is read from Firestore by the server, never trusted from the client.
- Admin panel routes call `requireAdmin(user)` which checks both the
  Firestore role and the `ADMIN_EMAILS` allowlist.

### Rate limiting

`src/lib/rate-limit.js` — token-bucket per `(ip, userId)` tuple, default
20 requests / minute. Configurable via `RATE_LIMIT_RPM`. Easily swappable
for Upstash Redis in production.

### Input validation

Every API route validates its body with **Zod** before doing any work.
File uploads are bounded to **10 MB** and `application/zip` only.

### Output sanitization

- Mermaid diagrams: the AI-generated graph string is parsed client-side by
  Mermaid (which produces SVG); we never pipe it through
  `dangerouslySetInnerHTML`.
- Markdown previews: rendered via a safe markdown renderer; raw HTML is
  stripped by **DOMPurify** before display.

### Cookies

Session-related cookies (none required for the default flow, but the
admin remember-me uses one) are set with `HttpOnly`, `Secure`,
`SameSite=Strict`.

## Dependency hygiene

`npm audit` runs in CI; high-severity advisories block merges. Renovate /
Dependabot recommended for keeping deps current.
