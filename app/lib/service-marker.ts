const MARKER_PATTERN = /^\[\[([A-Z0-9_]+)\]\]$/;

/** Resolve marker `[[XXX]]` (mis. dari faktur utang) ke label terjemahan lewat namespace i18n `serviceMarkers` — label jasa biasa (bukan marker) dikembalikan apa adanya. */
export function resolveServiceLabel(label: string, t: (key: string) => string): string {
  const match = MARKER_PATTERN.exec(label);
  if (!match) return label;
  try {
    return t(match[1]);
  } catch {
    return label;
  }
}
