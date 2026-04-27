"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Code2, LogIn, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Repo Analyze" },
  { href: "/docs-gen", label: "Docs Gen" },
  { href: "/ai-check", label: "AI Check" },
  { href: "/certificate", label: "Certificate" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const { user, plan, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-neon-blue" />
          <span className="font-semibold tracking-wide">
            <span className="gradient-text">Codara</span>
          </span>
        </Link>
        <nav className="hidden gap-4 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-ink-dim hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {plan === "premium" && (
            <span className="badge text-neon-green border-neon-green/40">
              <ShieldCheck className="mr-1 h-3 w-3" /> Premium
            </span>
          )}
          {user ? (
            <button onClick={logout} className="btn-ghost">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          ) : (
            <Link href="/login" className="btn-primary">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
