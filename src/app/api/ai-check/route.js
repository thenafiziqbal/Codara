import { NextResponse } from "next/server";
import { requireUser, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError, withRateLimitHeaders } from "@/lib/rate-limit";
import { aiCheckSchema, parseOrThrow } from "@/lib/validators";
import { generate, tryParseJson, PROMPTS, AIProviderError } from "@/lib/ai-providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let rlInfo;
  try {
    const user = await requireUser(req);
    rlInfo = rateLimit(req, `aicheck:${user.uid}`);
    const data = parseOrThrow(aiCheckSchema, await req.json());
    const prompt = `${PROMPTS.AI_CHECK}\n\nCode snippet:\n${data.code}`;
    const raw = await generate({ provider: data.provider, system: PROMPTS.AI_CHECK, user: prompt });
    const parsed = tryParseJson(raw) || {};
    const ai = clamp(parsed.aiProbability, 0, 100, 50);
    const human = clamp(parsed.humanProbability, 0, 100, 100 - ai);
    return withRateLimitHeaders(
      NextResponse.json({
        aiProbability: ai,
        humanProbability: human,
        reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
        signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 20) : [],
      }),
      rlInfo
    );
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json({ error: e.message }, { status: 429, headers: { "retry-after": String(e.retryAfterSec) } });
    }
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof AIProviderError) return NextResponse.json({ error: e.message }, { status: e.status });
    const status = e?.status || 500;
    safeLog("[ai-check] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}

function clamp(n, min, max, fallback) {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
