import { useEffect, useState } from "react";

export interface CaptionStyle {
  fontSize: number; // px at 1080p baseline; we scale via clamp
  fontFamily: string;
  textColor: string;
  bgOpacity: number; // 0..1
  edgeStyle: "none" | "shadow" | "outline";
  position: number; // % from bottom, 5..40
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 22,
  fontFamily: "system-ui",
  textColor: "#ffffff",
  bgOpacity: 0.55,
  edgeStyle: "shadow",
  position: 12,
};

const KEY = "caption-style:v1";

function read(): CaptionStyle {
  if (typeof window === "undefined") return DEFAULT_CAPTION_STYLE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CAPTION_STYLE;
    return { ...DEFAULT_CAPTION_STYLE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CAPTION_STYLE;
  }
}

const listeners = new Set<(s: CaptionStyle) => void>();
let current: CaptionStyle | null = null;

export function useCaptionStyle(): [CaptionStyle, (patch: Partial<CaptionStyle>) => void, () => void] {
  const [state, setState] = useState<CaptionStyle>(() => {
    if (current) return current;
    current = read();
    return current;
  });
  useEffect(() => {
    const fn = (s: CaptionStyle) => setState(s);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const update = (patch: Partial<CaptionStyle>) => {
    const next = { ...(current ?? DEFAULT_CAPTION_STYLE), ...patch };
    current = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    listeners.forEach((l) => l(next));
  };
  const reset = () => update(DEFAULT_CAPTION_STYLE);
  return [state, update, reset];
}

export function captionCssStyle(s: CaptionStyle): React.CSSProperties {
  const bg = `rgba(0,0,0,${s.bgOpacity})`;
  let textShadow: string | undefined;
  if (s.edgeStyle === "shadow") textShadow = "0 2px 6px rgba(0,0,0,0.9)";
  else if (s.edgeStyle === "outline")
    textShadow =
      "-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 4px rgba(0,0,0,0.9)";
  return {
    background: s.bgOpacity > 0 ? bg : "transparent",
    color: s.textColor,
    fontFamily: s.fontFamily,
    fontSize: `clamp(14px, ${s.fontSize / 14}vw, ${s.fontSize * 1.6}px)`,
    textShadow,
  };
}