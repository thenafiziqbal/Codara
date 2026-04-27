"use client";

export function CodeArea({ value, onChange, placeholder, rows = 14, maxLength = 200000 }) {
  return (
    <textarea
      className="input font-mono text-xs"
      style={{ minHeight: rows * 18 }}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
