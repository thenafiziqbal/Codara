import { NextResponse } from "next/server";
import JSZip from "jszip";
import { requireUser, AuthError, safeLog } from "@/lib/security";
import { rateLimit, RateLimitError, withRateLimitHeaders } from "@/lib/rate-limit";
import { analyzeSchema, parseOrThrow } from "@/lib/validators";
import { generate, tryParseJson, PROMPTS, AIProviderError } from "@/lib/ai-providers";
import { fetchRepoSample, joinFilesForPrompt } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ZIP_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ZIP_FILE_BYTES = 1 * 1024 * 1024; // 1 MB per file
const MAX_TOTAL_TEXT = 200_000;
const ALLOW_EXT = /\.(js|jsx|ts|tsx|py|go|rs|java|kt|rb|php|c|h|cpp|cs|md|json|yml|yaml|toml)$/i;

async function readZip(file) {
  if (!file) throw Object.assign(new Error("Missing file."), { status: 400 });
  if (file.type && !/zip/i.test(file.type)) {
    throw Object.assign(new Error("Only .zip uploads are accepted."), { status: 400 });
  }
  if (file.size > MAX_ZIP_BYTES) {
    throw Object.assign(new Error("File too large (max 10 MB)."), { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const files = [];
  let total = 0;
  for (const name of Object.keys(zip.files)) {
    const entry = zip.files[name];
    if (entry.dir) continue;
    if (!ALLOW_EXT.test(entry.name)) continue;
    if (total >= MAX_TOTAL_TEXT) break;
    const data = await entry.async("uint8array");
    if (data.length > MAX_ZIP_FILE_BYTES) continue;
    const text = Buffer.from(data).toString("utf8").slice(0, MAX_TOTAL_TEXT - total);
    total += text.length;
    files.push({ path: entry.name, content: text });
  }
  return { repo: "uploaded.zip", files, truncated: total >= MAX_TOTAL_TEXT };
}

export async function POST(req) {
  let rlInfo;
  try {
    const user = await requireUser(req);
    rlInfo = rateLimit(req, `analyze:${user.uid}`);

    const ct = req.headers.get("content-type") || "";
    let sample;
    let provider = "gemini";

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      provider = form.get("provider") === "grok" ? "grok" : "gemini";
      sample = await readZip(file);
    } else {
      const body = await req.json();
      const data = parseOrThrow(analyzeSchema, body);
      provider = data.provider;
      if (data.source === "github") {
        if (!data.url) {
          return NextResponse.json({ error: "GitHub URL required." }, { status: 400 });
        }
        sample = await fetchRepoSample(data.url);
      } else {
        if (!data.code) {
          return NextResponse.json({ error: "code required." }, { status: 400 });
        }
        sample = { repo: "snippet", files: [{ path: "snippet", content: data.code }] };
      }
    }

    const prompt = `${PROMPTS.ANALYZE}\n\nRepository: ${sample.repo}\n${joinFilesForPrompt(sample)}`;
    const raw = await generate({ provider, system: PROMPTS.ANALYZE, user: prompt });
    const parsed = tryParseJson(raw) || {};

    const result = {
      readme: parsed.readme || "",
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack.slice(0, 30) : [],
      coreFunctions: Array.isArray(parsed.coreFunctions) ? parsed.coreFunctions.slice(0, 50) : [],
      mermaid: typeof parsed.mermaid === "string" ? parsed.mermaid : "",
      healthScore: Number.isFinite(parsed.healthScore) ? parsed.healthScore : 70,
      complexity: Number.isFinite(parsed.complexity) ? parsed.complexity : 50,
      functionCount: Number.isFinite(parsed.functionCount) ? parsed.functionCount : 0,
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues.slice(0, 50) : [],
      meta: {
        repo: sample.repo,
        provider,
        truncated: !!sample.truncated,
      },
    };

    return withRateLimitHeaders(NextResponse.json(result), rlInfo);
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: e.message },
        { status: 429, headers: { "retry-after": String(e.retryAfterSec) } }
      );
    }
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof AIProviderError) {
      safeLog("[analyze] provider error:", e.message);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const status = e?.status || 500;
    safeLog("[analyze] error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}
