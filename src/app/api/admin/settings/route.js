import { NextResponse } from "next/server";
import { requireUser, requireAdmin, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError } from "@/lib/rate-limit";
import { adminSettingsSchema, parseOrThrow } from "@/lib/validators";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOC = ["site", "settings"];

const DEFAULTS = {
  siteName: "Codara",
  tagline: "AI Code Intelligence Platform",
  primaryColor: "#00b3ff",
  pricing: {
    free: {
      label: "Free",
      priceText: "$0 / forever",
      features: ["Repo Analyze (3 / day)", "AI Check", "Public dashboard"],
    },
    premium: {
      label: "Premium",
      priceText: "$9 / month",
      features: [
        "Unlimited Repo Analyze",
        "Docs Generator",
        "Health Certificates with QR verify",
        "Priority AI provider",
      ],
    },
  },
  features: [
    { title: "Repo Analyze", description: "AI-generated README, tech stack, architecture diagram." },
    { title: "Docs Generator", description: "README, CONTRIBUTING, ARCHITECTURE, API in one click." },
    { title: "AI Check", description: "Detect AI-generated code with probability scoring." },
    { title: "Health Certificate", description: "Premium signed certificate with QR verification." },
  ],
  links: { github: "", twitter: "", docs: "" },
};

export async function GET() {
  try {
    const snap = await adminDb().collection(DOC[0]).doc(DOC[1]).get();
    const data = snap.exists ? { ...DEFAULTS, ...snap.data() } : DEFAULTS;
    return NextResponse.json(data);
  } catch (e) {
    safeLog("[admin/settings GET] error:", e?.message || e);
    return NextResponse.json(DEFAULTS);
  }
}

export async function PUT(req) {
  try {
    const user = await requireUser(req);
    await requireAdmin(user);
    rateLimit(req, `admin-settings:${user.uid}`, 30);
    const body = parseOrThrow(adminSettingsSchema, await req.json());
    await adminDb().collection(DOC[0]).doc(DOC[1]).set(body, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    safeLog("[admin/settings PUT] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: e?.status || 500 });
  }
}
