import { NextResponse } from "next/server";
import { requireUser, requireAdmin, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";
import { adminDb } from "@/lib/firebase-admin";
import { z } from "zod";
import { parseOrThrow } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const upgradeSchema = z.object({
  uid: z.string().min(1).max(128),
  plan: z.enum(["free", "premium"]),
});

export async function GET(req) {
  try {
    const user = await requireUser(req);
    await requireAdmin(user);
    rateLimit(req, `admin-users:${user.uid}`, 30);
    const snap = await adminDb().collection("users").limit(200).get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[admin/users GET] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await requireUser(req);
    await requireAdmin(user);
    rateLimit(req, `admin-users:${user.uid}`, 60);
    const data = parseOrThrow(upgradeSchema, await req.json());
    await adminDb().collection("users").doc(data.uid).set(
      {
        plan: data.plan,
        pendingVerification: false,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, uid: data.uid, plan: data.plan });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[admin/users PUT] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: e?.status || 500 });
  }
}
