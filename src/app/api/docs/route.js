import { NextResponse } from "next/server";
import { requireUser, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError, withRateLimitHeaders } from "@/lib/rate-limit";
import { docsSchema, parseOrThrow } from "@/lib/validators";
import { generate, tryParseJson, PROMPTS, AIProviderError } from "@/lib/ai-providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let rlInfo;
  try {
    const user = await requireUser(req);
    rlInfo = rateLimit(req, `docs:${user.uid}`);
    const data = parseOrThrow(docsSchema, await req.json());

    const prompt = `${PROMPTS.DOCS}\n\nCodebase:\n${data.code}`;
    const raw = await generate({ provider: data.provider, system: PROMPTS.DOCS, user: prompt });
    const parsed = tryParseJson(raw);

    let docs = [];
    if (Array.isArray(parsed)) {
      docs = parsed
        .filter((x) => x && typeof x.filename === "string" && typeof x.content === "string")
        .slice(0, 8)
        .map((x) => ({ filename: x.filename, content: x.content }));
    }
    if (docs.length === 0) {
      // Fallback: provider returned plain markdown
      docs = [{ filename: "README.md", content: raw.slice(0, 50_000) }];
    }
    return withRateLimitHeaders(NextResponse.json({ docs }), rlInfo);
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json({ error: e.message }, { status: 429, headers: { "retry-after": String(e.retryAfterSec) } });
    }
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof AIProviderError) {
      safeLog("[docs] provider error:", e.message);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const status = e?.status || 500;
    safeLog("[docs] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}
