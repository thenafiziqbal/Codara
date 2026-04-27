import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { requireUser, requirePremium, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";
import { adminDb } from "@/lib/firebase-admin";
import { certificateSchema, parseOrThrow } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req) {
  try {
    const user = await requireUser(req);
    await requirePremium(user);
    rateLimit(req, `cert:${user.uid}`, 5);
    const data = parseOrThrow(certificateSchema, await req.json());

    const id = crypto.randomBytes(8).toString("hex");
    const issuedAt = new Date().toISOString();
    const verifyUrl = `${siteUrl()}/verify/${id}`;

    const record = {
      id,
      ownerUid: user.uid,
      ownerEmail: user.email || null,
      projectName: data.projectName,
      repoUrl: data.repoUrl || "",
      metrics: data.metrics,
      issuedAt,
      grade: gradeFor(data.metrics.healthScore),
    };

    await adminDb().collection("certificates").doc(id).set(record);

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#04060f", light: "#ffffff" },
    });

    return NextResponse.json({
      id,
      verifyUrl,
      issuedAt,
      qrDataUrl,
      grade: record.grade,
    });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[certificate] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: e?.status || 500 });
  }
}

function gradeFor(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}
