import "server-only";

/**
 * Fetch a small, capped sample of source files from a public GitHub repo.
 * No auth required for public repos. Caps total bytes so we never feed
 * megabytes into the AI provider.
 */
const MAX_TOTAL_BYTES = 200_000;
const MAX_FILES = 30;

const ALLOW_EXT = /\.(js|jsx|ts|tsx|py|go|rs|java|kt|rb|php|c|h|cpp|cs|swift|m|mm|sh|sql|md|json|yml|yaml|toml)$/i;
const SKIP_DIR = /^(node_modules|dist|build|\.next|out|\.git|__pycache__|coverage|vendor|target)\b/i;

function parseRepo(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

async function ghFetch(path) {
  const headers = { accept: "application/vnd.github+json" };
  const tok = process.env.GITHUB_TOKEN;
  if (tok) headers.authorization = `Bearer ${tok}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`GitHub ${res.status}: ${text.slice(0, 160)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchRepoSample(repoUrl) {
  const parsed = parseRepo(repoUrl);
  if (!parsed) throw Object.assign(new Error("Invalid GitHub URL."), { status: 400 });
  const { owner, repo } = parsed;
  const meta = await ghFetch(`/repos/${owner}/${repo}`);
  const branch = meta.default_branch || "main";
  const tree = await ghFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const files = (tree.tree || [])
    .filter((n) => n.type === "blob")
    .filter((n) => !n.path.split("/").some((seg) => SKIP_DIR.test(seg)))
    .filter((n) => ALLOW_EXT.test(n.path))
    .sort((a, b) => (a.size || 0) - (b.size || 0))
    .slice(0, MAX_FILES);

  let total = 0;
  const out = [];
  for (const f of files) {
    if (total >= MAX_TOTAL_BYTES) break;
    try {
      const blobRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${f.path}`,
        { headers: process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {} }
      );
      if (!blobRes.ok) continue;
      const text = await blobRes.text();
      const slice = text.slice(0, Math.max(0, MAX_TOTAL_BYTES - total));
      total += slice.length;
      out.push({ path: f.path, content: slice });
    } catch {
      // skip individual file failures
    }
  }
  return {
    repo: `${owner}/${repo}`,
    branch,
    description: meta.description || "",
    stargazers: meta.stargazers_count || 0,
    files: out,
    truncated: total >= MAX_TOTAL_BYTES,
  };
}

export function joinFilesForPrompt(sample) {
  return sample.files
    .map((f) => `\n----- ${f.path} -----\n${f.content}`)
    .join("\n")
    .slice(0, MAX_TOTAL_BYTES);
}
