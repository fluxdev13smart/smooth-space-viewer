export interface Cue {
  start: number; // seconds
  end: number;
  text: string;
}

const toSec = (h: string, m: string, s: string, ms: string) =>
  +h * 3600 + +m * 60 + +s + +ms / 1000;

export function parseSubtitles(raw: string): Cue[] {
  // Strip BOM and normalize line endings
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();

  // Detect VTT
  const isVtt = /^WEBVTT/i.test(text);

  // Timestamp pattern (handles both , and . for ms)
  const ts =
    /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;

  const cues: Cue[] = [];
  const blocks = text.split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length) continue;
    if (isVtt && /^WEBVTT/i.test(lines[0])) continue;

    let tsLine = lines.find((l) => ts.test(l));
    if (!tsLine) continue;
    const m = tsLine.match(ts)!;
    const start = toSec(m[1], m[2], m[3], m[4].padEnd(3, "0"));
    const end = toSec(m[5], m[6], m[7], m[8].padEnd(3, "0"));

    const textLines = lines.slice(lines.indexOf(tsLine) + 1);
    const cueText = textLines
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]+\}/g, "")
      .trim();
    if (cueText) cues.push({ start, end, text: cueText });
  }

  return cues.sort((a, b) => a.start - b.start);
}

export function findCue(cues: Cue[], t: number): Cue | null {
  // Binary search
  let lo = 0,
    hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid];
    if (t < c.start) hi = mid - 1;
    else if (t > c.end) lo = mid + 1;
    else return c;
  }
  return null;
}
