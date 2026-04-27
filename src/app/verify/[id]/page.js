async function fetchCert(id) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/verify/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }) {
  const cert = await fetchCert(params.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Certificate verification</h1>
      <p className="text-sm text-ink-dim">ID: {params.id}</p>

      {!cert ? (
        <div className="card mt-6 text-red-300">
          ❌ Certificate not found or invalid.
        </div>
      ) : (
        <div className="card mt-6">
          <p className="text-xs uppercase tracking-widest text-neon-green">
            Verified by Codara
          </p>
          <h2 className="mt-1 text-3xl font-bold gradient-text">
            {cert.projectName}
          </h2>
          <p className="text-sm text-ink-dim">
            Grade {cert.grade} · Issued {new Date(cert.issuedAt).toLocaleString()}
          </p>
          {cert.repoUrl && (
            <p className="mt-2 text-sm">
              Repo:{" "}
              <a className="text-neon-blue" href={cert.repoUrl} target="_blank" rel="noreferrer">
                {cert.repoUrl}
              </a>
            </p>
          )}
          <hr className="my-4 border-white/10" />
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div><dt className="text-ink-dim">Health</dt><dd className="text-2xl">{cert.metrics?.healthScore}</dd></div>
            <div><dt className="text-ink-dim">Complexity</dt><dd className="text-2xl">{cert.metrics?.complexity}</dd></div>
            <div><dt className="text-ink-dim">Functions</dt><dd className="text-2xl">{cert.metrics?.functions}</dd></div>
            <div><dt className="text-ink-dim">Security issues</dt><dd className="text-2xl">{cert.metrics?.securityIssues}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
