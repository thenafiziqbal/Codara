"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";
import { CodeArea } from "@/components/CodeArea";
import { Bot, User } from "lucide-react";

export default function AICheckPage() {
  return (
    <AuthGate>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const { authedFetch } = useAuth();
  const [code, setCode] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function run(e) {
    e.preventDefault();
    setErr("");
    setResult(null);
    setBusy(true);
    try {
      const res = await authedFetch("/api/ai-check", {
        method: "POST",
        body: JSON.stringify({ code, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI check failed.");
      setResult(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">AI Check</h1>
      <p className="text-sm text-ink-dim">
        Estimate the probability that a snippet was written by AI vs. a human.
      </p>

      <form onSubmit={run} className="card mt-6 space-y-3">
        <CodeArea value={code} onChange={setCode} rows={12} placeholder="// paste code" />
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
            {busy ? "Analyzing…" : "Check"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>

      {result && (
        <div className="card mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 p-4 text-center">
              <Bot className="mx-auto h-6 w-6 text-neon-blue" />
              <div className="mt-2 text-3xl font-semibold">{result.aiProbability}%</div>
              <div className="text-xs text-ink-dim">AI-generated</div>
            </div>
            <div className="rounded-lg border border-white/10 p-4 text-center">
              <User className="mx-auto h-6 w-6 text-neon-green" />
              <div className="mt-2 text-3xl font-semibold">{result.humanProbability}%</div>
              <div className="text-xs text-ink-dim">Human-written</div>
            </div>
          </div>
          {result.reasoning && (
            <>
              <h3 className="mt-4 font-semibold">Reasoning</h3>
              <p className="mt-1 text-sm text-ink-dim">{result.reasoning}</p>
            </>
          )}
          {result.signals?.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">Signals</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-ink-dim">
                {result.signals.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
