import { useEffect, useRef, useState } from "react";
import { findCue, type Cue } from "@/lib/subtitles";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

export function YouTubePlayer({
  videoId,
  cues,
  captionsEnabled,
  title,
}: {
  videoId: string;
  cues: Cue[];
  captionsEnabled: boolean;
  title: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const [cueText, setCueText] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    loadYTApi().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 0,
          playsinline: 1,
        },
      });
    });
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  // Subtitle loop
  useEffect(() => {
    if (!captionsEnabled || cues.length === 0) {
      setCueText("");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = "";
    const tick = () => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        try {
          const t = p.getCurrentTime();
          const c = findCue(cues, t);
          const txt = c?.text ?? "";
          if (txt !== last) {
            last = txt;
            setCueText(txt);
          }
        } catch {}
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cues, captionsEnabled]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border shadow-[var(--shadow-card)]">
      <div ref={hostRef} title={title} className="absolute inset-0 size-full" />
      {captionsEnabled && cueText && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex justify-center px-6">
          <div className="max-w-3xl text-center">
            <span
              className="inline-block whitespace-pre-line rounded-md bg-black/55 px-3 py-1.5 text-[clamp(16px,2.4vw,28px)] font-medium leading-snug text-white"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
            >
              {cueText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
