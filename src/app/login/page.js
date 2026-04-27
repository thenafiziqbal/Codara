"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signInEmail, signUpEmail, signInGoogle, configured, user } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (user) {
    if (typeof window !== "undefined") router.replace("/dashboard");
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await signInEmail(email, password);
      else await signUpEmail(email, password);
      router.replace("/dashboard");
    } catch (e) {
      setErr(e?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr("");
    setBusy(true);
    try {
      await signInGoogle();
      router.replace("/dashboard");
    } catch (e) {
      setErr(e?.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="card">
        <h1 className="text-xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        {!configured && (
          <p className="mt-2 text-xs text-amber-300">
            Firebase config detected but Auth must be enabled in Firebase
            Console (Email/Password + Google).
          </p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-ink-dim">or</div>
        <button onClick={google} className="btn-ghost w-full" disabled={busy}>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-xs text-ink-dim hover:text-ink"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
