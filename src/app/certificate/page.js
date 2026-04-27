"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";

export default function CertificatePage() {
  return (
    <AuthGate requirePremium>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const { authedFetch } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [healthScore, setHealthScore] = useState(80);
  const [complexity, setComplexity] = useState(45);
  const [functions, setFunctions] = useState(120);
  const [securityIssues, setSecurityIssues] = useState(2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cert, setCert] = useState(null);

  async function issue(e) {
    e.preventDefault();
    setErr("");
    setCert(null);
    setBusy(true);
    try {
      const res = await authedFetch("/api/certificate", {
        method: "POST",
        body: JSON.stringify({
          projectName,
          repoUrl,
          metrics: {
            healthScore: Number(healthScore),
            complexity: Number(complexity),
            functions: Number(functions),
            securityIssues: Number(securityIssues),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to issue certificate.");
      setCert(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function printCert() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Health Certificate</h1>
      <p className="text-sm text-ink-dim">
        Issue a verifiable health certificate (premium). The QR code points
        to a public verify URL.
      </p>

      <form onSubmit={issue} className="card mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 print:hidden">
        <div>
          <label className="label">Project name</label>
          <input className="input" required value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>
        <div>
          <label className="label">Repo URL (optional)</label>
          <input className="input" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
        </div>
        <div>
          <label className="label">Health score (0-100)</label>
          <input className="input" type="number" min="0" max="100" value={healthScore} onChange={(e) => setHealthScore(e.target.value)} />
        </div>
        <div>
          <label className="label">Complexity (0-100)</label>
          <input className="input" type="number" min="0" max="100" value={complexity} onChange={(e) => setComplexity(e.target.value)} />
        </div>
        <div>
          <label className="label">Function count</label>
          <input className="input" type="number" min="0" value={functions} onChange={(e) => setFunctions(e.target.value)} />
        </div>
        <div>
          <label className="label">Security issues</label>
          <input className="input" type="number" min="0" value={securityIssues} onChange={(e) => setSecurityIssues(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-center justify-between">
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button className="btn-neon ml-auto" disabled={busy || !projectName}>
            {busy ? "Issuing…" : "Issue certificate"}
          </button>
        </div>
      </form>

      {cert && (
        <div className="card mt-8 print:border-0 print:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-neon-green">Codara Verified</p>
              <h2 className="mt-1 text-3xl font-bold gradient-text">{projectName}</h2>
              <p className="text-sm text-ink-dim">Project Health Certificate · Grade {cert.grade}</p>
            </div>
            <img src={cert.qrDataUrl} alt="verify QR" width={140} height={140} className="rounded bg-white p-2" />
          </div>
          <hr className="my-4 border-white/10" />
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div><dt className="text-ink-dim">Health</dt><dd className="text-2xl">{healthScore}</dd></div>
            <div><dt className="text-ink-dim">Complexity</dt><dd className="text-2xl">{complexity}</dd></div>
            <div><dt className="text-ink-dim">Functions</dt><dd className="text-2xl">{functions}</dd></div>
            <div><dt className="text-ink-dim">Security issues</dt><dd className="text-2xl">{securityIssues}</dd></div>
          </dl>
          <p className="mt-4 break-all text-xs text-ink-dim">
            Verify: <a className="text-neon-blue" href={cert.verifyUrl}>{cert.verifyUrl}</a>
          </p>
          <p className="text-xs text-ink-dim">Issued: {new Date(cert.issuedAt).toLocaleString()}</p>
          <button onClick={printCert} className="btn-ghost mt-4 print:hidden">
            Save as PDF / Print
          </button>
        </div>
      )}
    </div>
  );
}
