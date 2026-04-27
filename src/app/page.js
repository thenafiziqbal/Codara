import Link from "next/link";
import { Code2, Sparkles, ShieldCheck, FileCode2, Bot, Award } from "lucide-react";

const FEATURES = [
  { icon: Code2, title: "Repo Analyze", desc: "Paste a GitHub URL or upload a .zip — get a professional README, tech stack, core function docs, and architecture diagram." },
  { icon: FileCode2, title: "Docs Generator", desc: "One-click generation of README, CONTRIBUTING, ARCHITECTURE, and API.md for any codebase." },
  { icon: Bot, title: "AI Check", desc: "Probability score for whether a code snippet was written by AI or a human, with reasoning." },
  { icon: Award, title: "Health Certificate", desc: "Premium signed PDF certificate with QR code for public verification." },
  { icon: Sparkles, title: "Dashboard", desc: "Health score, complexity, function count, and security issues in one view." },
  { icon: ShieldCheck, title: "Built-in security", desc: "Strict CSP, server-side AI keys, rate limiting, Zod validation, premium gating verified server-side." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <section className="mx-auto max-w-3xl text-center">
        <span className="badge mb-4">AI Code Intelligence Platform</span>
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">
          Ship code with <span className="gradient-text">confidence</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-dim">
          Codara analyzes your repo, generates pro docs, detects AI-written
          code, and issues verifiable health certificates — powered by Gemini
          and Grok.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/analyze" className="btn-primary">
            Analyze a repo
          </Link>
          <Link href="/pricing" className="btn-ghost">
            See pricing
          </Link>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div key={i} className="card transition hover:border-neon-blue/40">
            <f.icon className="h-6 w-6 text-neon-blue" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-ink-dim">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
