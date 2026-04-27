"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

/**
 * Minimal, safe markdown -> HTML renderer.
 * - Escapes HTML, then converts a small subset of markdown.
 * - Final HTML is sanitized with DOMPurify.
 *
 * Intentionally does NOT support raw HTML, scripts, iframes, or onclick.
 */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mdToHtml(md) {
  if (!md) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (let raw of lines) {
    const line = raw;
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeLang = fence[1] || "";
        codeBuf = [];
      } else {
        html += `<pre data-lang="${escapeHtml(codeLang)}"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`;
        inCode = false;
        codeLang = "";
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (/^\s*$/.test(line)) {
      flushList();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushList();
      const lvl = h[1].length;
      html += `<h${lvl}>${inline(escapeHtml(h[2]))}</h${lvl}>`;
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.+)$/);
    if (li) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(escapeHtml(li[1]))}</li>`;
      continue;
    }
    flushList();
    html += `<p>${inline(escapeHtml(line))}</p>`;
  }
  if (inCode) {
    html += `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`;
  }
  flushList();
  return html;
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function SafeMarkdown({ source }) {
  const html = useMemo(() => {
    const raw = mdToHtml(source || "");
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "code", "pre", "strong", "em", "a", "blockquote", "br"],
      ALLOWED_ATTR: ["href", "target", "rel", "data-lang"],
    });
  }, [source]);
  return (
    <div
      className="prose-invert max-w-none [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg
                 [&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6
                 [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-auto
                 [&_code]:font-mono [&_code]:text-sm [&_a]:text-neon-blue"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
