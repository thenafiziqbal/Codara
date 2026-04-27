"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { MermaidView } from "@/components/MermaidView";
import { MetricRing } from "@/components/MetricRing";
import { ShieldAlert } from "lucide-react";

export default function AnalyzePage() {
  return (
    <AuthGate>
      <AnalyzeInner />
    </AuthGate>
  );
}

function AnalyzeInner() {
  const { authedFetch } = useAuth();
  const [mode, setMode] = useState("github");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [provider, setProvider] = useState("gemini");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function run(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    setResult(null);
    try {
      let res;
      if (mode === "zip") {
        if (!file) throw new Error("Choose a .zip file.");
        if (file.size > 10 * 1024 * 1024) throw new Error("Max 10 MB.");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("provider", provider);
        res = await authedFetch("/api/analyze", { method: "POST", body: fd });
      } else {
        const body =
          mode === "github"
            ? { source: "github", url, provider }
            : { source: "snippet", code, provider };
        res = await authedFetch("/api/analyze", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyze failed.");
      setResult(data);
      try {
        localStorage.setItem("codara:lastAnalyze", JSON.stringify(data));
      } catch {
        // ignore
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Repo Analyze</h1>
      <p className="text-sm text-ink-dim">
        AI-powered analysis of any GitHub repo, ZIP archive, or pasted code.
      </p>

      <form onSubmit={run} className="card mt-6 space-y-3">
        <div className="flex gap-2 text-xs">
          {["github", "zip", "snippet"].map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={`btn ${mode === m ? "btn-primary" : "btn-ghost"}`}
            >
              {m === "github" ? "GitHub URL" : m === "zip" ? "ZIP upload" : "Paste code"}
            </button>
          ))}
        </div>

        {mode === "github" && (
          <div>
            <label className="label">GitHub repo URL</label>
            <input
              className="input"
              placeholder="https://github.com/vercel/next.js"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
        )}
        {mode === "zip" && (
          <div>
            <label className="label">ZIP archive (≤ 10 MB)</label>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
              required
            />
          </div>
        )}
        {mode === "snippet" && (
          <div>
            <label className="label">Paste code</label>
            <textarea
              className="input font-mono text-xs"
              rows={10}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={200000}
              placeholder="// paste any source code"
              required
            />
          </div>
        )}

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
          <button className="btn-primary" disabled={busy}>
            {busy ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>

      {result && (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <h2 className="font-semibold">Metrics</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MetricRing value={result.healthScore} label="Health" color="#39ff14" />
              <MetricRing value={result.complexity} label="Complexity" color="#00b3ff" />
            </div>
            <p className="mt-3 text-xs text-ink-dim">
              Functions detected: <strong>{result.functionCount}</strong>
            </p>
            <h3 className="mt-4 font-semibold">Tech stack</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {(result.techStack || []).map((t, i) => (
                <span key={i} className="badge">{t}</span>
              ))}
            </div>
            <h3 className="mt-4 font-semibold flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-red-400" /> Security issues
            </h3>
            <ul className="mt-1 space-y-1 text-xs">
              {(result.securityIssues || []).length === 0 && (
                <li className="text-ink-dim">No issues flagged.</li>
              )}
              {(result.securityIssues || []).map((s, i) => (
                <li key={i} className="rounded border border-white/10 p-2">
                  <span className="badge mr-2">{s.severity}</span>
                  <strong>{s.title}</strong>
                  <div className="text-ink-dim">{s.detail}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="font-semibold">Generated README</h2>
            <SafeMarkdown source={result.readme} />
            <h2 className="mt-6 font-semibold">Architecture diagram</h2>
            {result.mermaid ? (
              <MermaidView chart={result.mermaid} />
            ) : (
              <p className="text-sm text-ink-dim">No diagram returned.</p>
            )}
            <h2 className="mt-6 font-semibold">Core functions</h2>
            <ul className="mt-2 space-y-2">
              {(result.coreFunctions || []).map((f, i) => (
                <li key={i} className="rounded border border-white/10 p-2 text-sm">
                  <code className="text-neon-blue">{f.name}</code>
                  <div className="text-ink-dim">{f.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
