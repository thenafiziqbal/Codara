export const metadata = { title: "Security · Codara" };

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose-invert">
      <h1 className="text-2xl font-semibold">Security</h1>
      <p className="text-sm text-ink-dim">
        How Codara protects your account, data, and code.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-ink">
        <li>Strict <code>Content-Security-Policy</code> with allowlist for trusted CDNs only.</li>
        <li><code>X-Frame-Options: DENY</code>, <code>X-Content-Type-Options: nosniff</code>, HSTS.</li>
        <li>AI provider keys (Gemini, Grok) live <strong>server-side only</strong>.</li>
        <li>Firebase Admin SDK verifies every API request.</li>
        <li>Premium gating is checked on the server, never trusted from the client.</li>
        <li>Per-IP + per-user rate limiting on every AI / mutation endpoint.</li>
        <li>All inputs validated with Zod; ZIP uploads bounded to 10 MB and content-type checked.</li>
        <li>Mermaid runs in <code>securityLevel: strict</code>; user-supplied markdown is sanitized with DOMPurify.</li>
        <li>Tokens, keys, and bearer headers are redacted from server logs.</li>
      </ul>
      <p className="mt-4 text-sm text-ink-dim">
        Found something? Email <a className="text-neon-blue" href="mailto:security@codara.app">security@codara.app</a>.
      </p>
    </div>
  );
}
