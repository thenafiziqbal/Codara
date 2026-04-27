"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function PricingPage() {
  const { authedFetch, user, plan, refreshPlan } = useAuth();
  const [paymentRef, setPaymentRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => null);
  }, []);

  async function upgrade() {
    if (!user) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await authedFetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ plan: "premium", paymentRef }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upgrade request failed.");
      setMsg("Upgrade requested. An admin will verify your payment shortly.");
      refreshPlan();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const free = settings?.pricing?.free;
  const premium = settings?.pricing?.premium;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      <p className="text-sm text-ink-dim">
        Start free. Upgrade to Premium for unlimited analysis and verifiable
        health certificates.
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">{free?.label || "Free"}</h2>
          <p className="mt-1 text-2xl font-bold">{free?.priceText || "$0"}</p>
          <ul className="mt-4 space-y-1 text-sm">
            {(free?.features || ["Repo Analyze (3 / day)", "AI Check", "Public dashboard"]).map((f, i) => (
              <li key={i}>✓ {f}</li>
            ))}
          </ul>
        </div>
        <div className="card border-neon-blue/40">
          <h2 className="text-lg font-semibold gradient-text">{premium?.label || "Premium"}</h2>
          <p className="mt-1 text-2xl font-bold">{premium?.priceText || "$9 / month"}</p>
          <ul className="mt-4 space-y-1 text-sm">
            {(premium?.features || [
              "Unlimited Repo Analyze",
              "Docs Generator",
              "Health Certificates with QR verify",
              "Priority AI provider",
            ]).map((f, i) => (
              <li key={i}>✓ {f}</li>
            ))}
          </ul>

          <div className="mt-5 border-t border-white/10 pt-4">
            {!user ? (
              <Link href="/login" className="btn-primary">
                Login to upgrade
              </Link>
            ) : plan === "premium" ? (
              <p className="badge text-neon-green border-neon-green/40">
                You are Premium ✓
              </p>
            ) : (
              <>
                <label className="label">Payment reference (bKash/Stripe TrxID)</label>
                <input
                  className="input"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TRX12345"
                />
                <button onClick={upgrade} className="btn-neon mt-3" disabled={busy}>
                  {busy ? "Submitting…" : "Request upgrade"}
                </button>
                {msg && <p className="mt-2 text-xs text-ink-dim">{msg}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
