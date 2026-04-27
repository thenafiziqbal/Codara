import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    name: "codara",
    version: "0.1.0",
    firebase: Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "edu1-4a91f"
    ),
    adminSdk: isAdminConfigured(),
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      grok: Boolean(process.env.GROK_API_KEY),
    },
    time: new Date().toISOString(),
  });
}
