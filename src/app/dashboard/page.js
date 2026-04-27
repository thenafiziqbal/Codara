"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { MetricRing } from "@/components/MetricRing";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, GitBranch, FileCode2, Bot } from "lucide-react";

const SAMPLE = {
  healthScore: 78,
  complexity: 42,
  functionCount: 134,
  securityIssues: 3,
};

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardInner />
    </AuthGate>
  );
}

function DashboardInner() {
  const { plan, user } = useAuth();
  const [stats, setStats] = useState(SAMPLE);
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("codara:lastAnalyze");
      if (raw) {
        const data = JSON.parse(raw);
        setStats({
          healthScore: data.healthScore ?? SAMPLE.healthScore,
          complexity: data.complexity ?? SAMPLE.complexity,
          functionCount: data.functionCount ?? SAMPLE.functionCount,
          securityIssues: (data.securityIssues || []).length,
        });
        setLatest(data);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-ink-dim">
            Welcome back{user?.email ? `, ${user.email}` : ""}. Plan:{" "}
            <span className="badge">{plan}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analyze" className="btn-primary">Analyze</Link>
          <Link href="/docs-gen" className="btn-ghost">Docs Gen</Link>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card flex flex-col items-center">
          <MetricRing value={stats.healthScore} label="Health" color="#39ff14" />
        </div>
        <div className="card flex flex-col items-center">
          <MetricRing value={stats.complexity} label="Complexity" color="#00b3ff" />
        </div>
        <div className="card flex flex-col items-center justify-center">
          <FileCode2 className="h-6 w-6 text-neon-blue" />
          <div className="mt-2 text-3xl font-semibold">{stats.functionCount}</div>
          <div className="text-xs text-ink-dim">Functions</div>
        </div>
        <div className="card flex flex-col items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-red-400" />
          <div className="mt-2 text-3xl font-semibold">{stats.securityIssues}</div>
          <div className="text-xs text-ink-dim">Security issues</div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Latest analysis</h2>
          {latest ? (
            <>
              <p className="mt-2 text-sm text-ink-dim">
                {latest.meta?.repo || "Last analyzed project"} —{" "}
                {latest.meta?.provider || "ai"}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-ink-dim">
                {(latest.techStack || []).slice(0, 8).map((t, i) => (
                  <li key={i} className="badge mr-1">{t}</li>
                ))}
              </ul>
              <Link href="/analyze" className="btn-ghost mt-4 inline-flex">
                Run another
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-dim">
              No analyses yet — try{" "}
              <Link className="text-neon-blue" href="/analyze">Repo Analyze</Link>.
            </p>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold">Tools</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link href="/analyze" className="hover:text-neon-blue"><GitBranch className="mr-1 inline h-4 w-4" /> Repo Analyze</Link></li>
            <li><Link href="/docs-gen" className="hover:text-neon-blue"><FileCode2 className="mr-1 inline h-4 w-4" /> Docs Generator</Link></li>
            <li><Link href="/ai-check" className="hover:text-neon-blue"><Bot className="mr-1 inline h-4 w-4" /> AI Detection</Link></li>
            <li><Link href="/certificate" className="hover:text-neon-blue">🏅 Health Certificate (Premium)</Link></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
