"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminPage() {
  return (
    <AuthGate>
      <AdminInner />
    </AuthGate>
  );
}

function AdminInner() {
  const { authedFetch } = useAuth();
  const [tab, setTab] = useState("settings");
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin panel</h1>
      <p className="text-xs text-ink-dim">
        Server-side checks ensure only admins can save changes.
      </p>
      <div className="mt-4 flex gap-2">
        {["settings", "users"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn ${tab === t ? "btn-primary" : "btn-ghost"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "settings" ? <Settings authedFetch={authedFetch} /> : <Users authedFetch={authedFetch} />}
      </div>
    </div>
  );
}

function Settings({ authedFetch }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="card shimmer h-64" />;

  function update(path, value) {
    setData((d) => {
      const next = JSON.parse(JSON.stringify(d));
      let cur = next;
      const keys = path.split(".");
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] ||= {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function save() {
    setMsg("Saving…");
    const res = await authedFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const out = await res.json();
    setMsg(res.ok ? "Saved ✓" : out?.error || "Failed");
  }

  return (
    <div className="card space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="label">Site name</label>
          <input className="input" value={data.siteName || ""} onChange={(e) => update("siteName", e.target.value)} />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="input" value={data.tagline || ""} onChange={(e) => update("tagline", e.target.value)} />
        </div>
        <div>
          <label className="label">Primary color</label>
          <input className="input" value={data.primaryColor || ""} onChange={(e) => update("primaryColor", e.target.value)} />
        </div>
      </div>

      <h3 className="mt-4 font-semibold">Pricing</h3>
      {["free", "premium"].map((tier) => (
        <div key={tier} className="rounded-lg border border-white/10 p-3">
          <p className="badge mb-2">{tier}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Label</label>
              <input className="input" value={data.pricing?.[tier]?.label || ""} onChange={(e) => update(`pricing.${tier}.label`, e.target.value)} />
            </div>
            <div>
              <label className="label">Price text</label>
              <input className="input" value={data.pricing?.[tier]?.priceText || ""} onChange={(e) => update(`pricing.${tier}.priceText`, e.target.value)} />
            </div>
          </div>
          <label className="label mt-2">Features (one per line)</label>
          <textarea
            className="input"
            rows={4}
            value={(data.pricing?.[tier]?.features || []).join("\n")}
            onChange={(e) => update(`pricing.${tier}.features`, e.target.value.split("\n").filter(Boolean).slice(0, 20))}
          />
        </div>
      ))}

      <h3 className="mt-4 font-semibold">Links</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {["github", "twitter", "docs"].map((k) => (
          <div key={k}>
            <label className="label">{k}</label>
            <input className="input" value={data.links?.[k] || ""} onChange={(e) => update(`links.${k}`, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} className="btn-primary">Save</button>
        <span className="text-xs text-ink-dim">{msg}</span>
      </div>
    </div>
  );
}

function Users({ authedFetch }) {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const res = await authedFetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed.");
      setUsers(data.users || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function setPlan(uid, plan) {
    setBusy(true);
    setErr("");
    try {
      const res = await authedFetch("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ uid, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed.");
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <table className="w-full text-sm">
        <thead className="text-ink-dim">
          <tr><th className="text-left">UID</th><th className="text-left">Email</th><th>Plan</th><th>Pending</th><th></th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid} className="border-t border-white/10">
              <td className="py-2 font-mono text-xs">{u.uid.slice(0, 12)}…</td>
              <td>{u.email || "—"}</td>
              <td className="text-center"><span className="badge">{u.plan || "free"}</span></td>
              <td className="text-center">{u.pendingVerification ? "✓" : "—"}</td>
              <td className="text-right">
                {u.plan !== "premium" ? (
                  <button className="btn-neon text-xs" disabled={busy} onClick={() => setPlan(u.uid, "premium")}>
                    Make premium
                  </button>
                ) : (
                  <button className="btn-ghost text-xs" disabled={busy} onClick={() => setPlan(u.uid, "free")}>
                    Downgrade
                  </button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} className="py-4 text-center text-ink-dim">No users.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
