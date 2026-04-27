"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGate({ children, requirePremium = false }) {
  const { user, loading, plan, configured } = useAuth();
  if (loading) {
    return (
      <div className="card mx-auto mt-10 max-w-md">
        <div className="h-6 w-40 shimmer rounded" />
        <div className="mt-3 h-3 w-full shimmer rounded" />
        <div className="mt-2 h-3 w-2/3 shimmer rounded" />
      </div>
    );
  }
  if (!configured) {
    return (
      <div className="card mx-auto mt-10 max-w-xl">
        <h2 className="text-lg font-semibold">Firebase not configured</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Set the <code>NEXT_PUBLIC_FIREBASE_*</code> values in <code>.env.local</code> to
          enable login. See <code>.env.example</code>.
        </p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <h2 className="text-lg font-semibold">Login required</h2>
        <p className="mt-2 text-sm text-ink-dim">
          You need an account to use this tool.
        </p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">
          Go to login
        </Link>
      </div>
    );
  }
  if (requirePremium && plan !== "premium") {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <h2 className="text-lg font-semibold">Premium feature</h2>
        <p className="mt-2 text-sm text-ink-dim">
          Upgrade to Premium to access this tool.
        </p>
        <Link href="/pricing" className="btn-neon mt-4 inline-flex">
          Upgrade
        </Link>
      </div>
    );
  }
  return children;
}
