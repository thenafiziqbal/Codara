"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";
import { CodeArea } from "@/components/CodeArea";
import { SafeMarkdown } from "@/components/SafeMarkdown";

export default function DocsPage() {
  return (
    <AuthGate>
      <DocsInner />
    </AuthGate>
  );
}

function DocsInner() {
  const { authedFetch } = useAuth();
  const [code, setCode] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    setDocs([]);
    try {
      const res = await authedFetch("/api/docs", {
        method: "POST",
        body: JSON.stringify({ code, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Docs generation failed.");
      setDocs(data.docs || []);
      setActive(0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function download(d) {
    const blob = new Blob([d.content], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = d.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Docs Generator</h1>
      <p className="text-sm text-ink-dim">
        Generates README.md, CONTRIBUTING.md, ARCHITECTURE.md, and API.md from a codebase.
      </p>

      <form onSubmit={run} className="card mt-6 space-y-3">
        <div>
          <label className="label">Codebase (paste your source)</label>
          <CodeArea
            value={code}
            onChange={setCode}
            placeholder="// paste your code here"
            rows={16}
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <label className="label">AI provider</label>
            <select
              className="input"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="gemini">Google Gemini</option>
              <option value="grok">xAI Grok</option>
            </select>
          </div>
          <button className="btn-primary" disabled={busy || !code}>
            {busy ? "Generating…" : "Generate docs"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>

      {docs.length > 0 && (
        <div className="card mt-6">
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {docs.map((d, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`btn ${active === i ? "btn-primary" : "btn-ghost"}`}
              >
                {d.filename}
              </button>
            ))}
            <button onClick={() => download(docs[active])} className="btn-neon ml-auto">
              Download
            </button>
          </div>
          <div className="mt-4">
            <SafeMarkdown source={docs[active]?.content || ""} />
          </div>
        </div>
      )}
    </div>
  );
}
