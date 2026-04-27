import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    rateLimit(req, "verify", 60);
    const id = String(params?.id || "").replace(/[^a-fA-F0-9]/g, "").slice(0, 32);
    if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    const snap = await adminDb().collection("certificates").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const data = snap.data();
    return NextResponse.json({
      id,
      projectName: data.projectName,
      repoUrl: data.repoUrl || "",
      metrics: data.metrics,
      issuedAt: data.issuedAt,
      grade: data.grade,
      issuedTo: data.ownerEmail || null,
      valid: true,
    });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
