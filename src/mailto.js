/** Conservative length for a mailto URL. Longer drafts are cut off by some email apps. */
export const MAILTO_SAFE_LENGTH = 1800;

export function buildMailto({ to, subject, body }) {
  const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {
    href,
    length: href.length,
    overLimit: href.length > MAILTO_SAFE_LENGTH,
  };
}
