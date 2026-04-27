import { NextResponse } from "next/server";
import { requireUser, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";
import { subscriptionSchema, parseOrThrow } from "@/lib/validators";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * NOTE: This endpoint records a subscription request server-side.
 * Real money flow (Stripe / bKash) should be wired through a verified
 * webhook before flipping `plan` to "premium". For now we accept a
 * paymentRef and mark `pendingVerification: true` unless the upgrade
 * is to "free".
 */
export async function GET(req) {
  try {
    const user = await requireUser(req);
    rateLimit(req, `sub:${user.uid}`, 30);
    const snap = await adminDb().collection("users").doc(user.uid).get();
    const data = snap.exists ? snap.data() : {};
    return NextResponse.json({
      plan: data.plan === "premium" ? "premium" : "free",
      pendingVerification: !!data.pendingVerification,
    });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[sub GET] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await requireUser(req);
    rateLimit(req, `sub:${user.uid}`, 5);
    const body = parseOrThrow(subscriptionSchema, await req.json());

    const ref = adminDb().collection("users").doc(user.uid);
    if (body.plan === "free") {
      await ref.set(
        { plan: "free", pendingVerification: false, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return NextResponse.json({ plan: "free", pendingVerification: false });
    }
    await ref.set(
      {
        plan: "free", // never trust the client to set premium
        pendingVerification: true,
        paymentRef: body.paymentRef || "",
        email: user.email || "",
        requestedPlan: "premium",
        requestedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return NextResponse.json({ plan: "free", pendingVerification: true });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[sub POST] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: e?.status || 500 });
  }
}
