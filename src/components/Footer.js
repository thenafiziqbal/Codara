import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 md:flex-row">
        <p className="text-xs text-ink-dim">
          © {new Date().getFullYear()} Codara — AI Code Intelligence Platform.
        </p>
        <div className="flex gap-3 text-xs text-ink-dim">
          <Link href="/admin">Admin</Link>
          <Link href="/security">Security</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
