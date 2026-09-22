/** Tiny classnames helper. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** SHA-256 hex digest of bytes via the Web Crypto API (matches crypto.sha256). */
export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

/** Score band -> label + css color var, iOS traffic-light semantics. */
export function scoreBand(score: number): { label: string; colorVar: string } {
  if (score >= 85) return { label: 'Excellent', colorVar: '--success' };
  if (score >= 70) return { label: 'Strong', colorVar: '--success' };
  if (score >= 55) return { label: 'Solid', colorVar: '--warning' };
  if (score >= 40) return { label: 'Developing', colorVar: '--warning' };
  if (score > 0) return { label: 'Needs work', colorVar: '--error' };
  return { label: 'No data', colorVar: '--text-tertiary' };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function prettyDimension(key: string): string {
  let out = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (out.length > 0) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
