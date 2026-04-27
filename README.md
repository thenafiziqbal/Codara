# Codara — AI Code Intelligence Platform

Codara is a developer-focused AI platform that analyzes codebases, generates
professional documentation, detects AI-written code, and issues verifiable
project health certificates.

## Features

- **Dashboard** — Health Score, Complexity, Function count, Security overview
- **Repo Analyze** — Paste a GitHub repo URL or upload a `.zip`. Codara
  produces a professional `README.md`, tech-stack breakdown, core function
  docs, and a Mermaid system architecture diagram.
- **Docs Generator** — One-click generation of `README.md`,
  `CONTRIBUTING.md`, `ARCHITECTURE.md`, and `API.md`.
- **AI Check** — Estimate the probability that a code snippet was generated
  by AI vs. written by a human.
- **Health Certificate** *(Premium)* — Downloadable PDF certificate with a
  QR code that points to a public verification URL.
- **Admin Panel** — Edit site settings, pricing, features, and links live.
- **Subscription System** — Free vs. Premium gating across features.

## Stack

- **Next.js 14** (App Router, JavaScript)
- **Tailwind CSS** (futuristic neon theme)
- **Firebase Auth + Firestore** (users, subscriptions, certificates)
- **Firebase Admin SDK** (server-side auth verification)
- **AI providers**: Google **Gemini** + xAI **Grok** (server-side only)
- **Zod** for input validation, **DOMPurify** for output sanitization
- **Framer Motion** for animations, **lucide-react** for icons

## Local development

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Firebase + AI provider keys

# 3. Run
npm run dev
# http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Project layout

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public landing
│   ├── dashboard/          # Authed dashboard
│   ├── analyze/            # Repo analyze tool
│   ├── docs-gen/           # Docs generator
│   ├── ai-check/           # AI detection
│   ├── certificate/        # Health certificate
│   ├── admin/              # Admin panel
│   ├── verify/[id]/        # Public certificate verification
│   ├── login/              # Auth
│   └── api/                # Route handlers (server-only)
│       ├── analyze/
│       ├── docs/
│       ├── ai-check/
│       ├── certificate/
│       ├── admin/
│       └── verify/
├── components/             # Shared UI
├── lib/                    # firebase, ai-providers, security, validators
└── hooks/                  # auth, settings
```

## Security

Codara takes security seriously. See [`SECURITY.md`](./SECURITY.md) for the
full checklist; key guarantees:

- **AI provider keys** (`GEMINI_API_KEY`, `GROK_API_KEY`) and the **Firebase
  Admin** service account live **server-side only** — never `NEXT_PUBLIC_*`.
- **Strict CSP** + `X-Frame-Options: DENY` + `nosniff` + HSTS via
  `next.config.mjs` headers.
- All `/api/*` routes require a valid Firebase ID token; premium-only routes
  re-check the user's role on the server (never trust the client).
- **Per-IP + per-user rate limiting** on every AI / mutation endpoint.
- **Zod input validation** + DOMPurify on any rendered remote content.
- **File uploads** are restricted to `.zip`, ≤ 10 MB, content-type checked.
- **No `dangerouslySetInnerHTML`** for user content; Mermaid renders to SVG
  on the client from a sanitized string.
- **HTTP-only, SameSite=Strict** cookies for any session state.
- **No secrets** are logged; redaction is enforced in the API logger.

## License

MIT — see [LICENSE](./LICENSE).
