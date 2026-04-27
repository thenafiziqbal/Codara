import { NextResponse } from "next/server";
import { firebaseConfigured } from "@/lib/firebase";
import { isAdminConfigured } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    name: "codara",
    version: "0.1.0",
    firebase: firebaseConfigured,
    adminSdk: isAdminConfigured(),
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      grok: Boolean(process.env.GROK_API_KEY),
    },
    time: new Date().toISOString(),
  });
}
