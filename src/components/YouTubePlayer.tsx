import { useEffect, useRef, useState } from "react";
import { findCue, type Cue } from "@/lib/subtitles";
import { CaptionMenu } from "@/components/CaptionMenu";
import { useCaptionStyle, captionCssStyle } from "@/lib/captionStyle";

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

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function YouTubePlayer({
  videoId,
  cues,
  captionsEnabled,
  title,
  onToggleCaptions,
  onCues,
  captionLabel,
  defaultQuery,
  defaultSeason,
  defaultEpisode,
}: {
  videoId: string;
  cues: Cue[];
  captionsEnabled: boolean;
  title: string;
  onToggleCaptions: (v: boolean) => void;
  onCues: (cues: Cue[], label: string) => void;
  captionLabel: string;
  defaultQuery?: string;
  defaultSeason?: number;
  defaultEpisode?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const [cueText, setCueText] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [scrubbing, setScrubbing] = useState<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const [captionStyle] = useCaptionStyle();
  const progressKey = `watch:progress:${videoId}`;
  const resumedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadYTApi().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          rel: 0,
          fs: 0,
          playsinline: 1,
          showinfo: 0,
        },
        events: {
          onReady: (e: any) => {
            const d = e.target.getDuration() || 0;
            setDuration(d);
            setVolume(e.target.getVolume() ?? 100);
            // Resume from last position
            try {
              const saved = parseFloat(localStorage.getItem(progressKey) || "");
              if (!resumedRef.current && isFinite(saved) && saved > 10 && (!d || saved < d - 30)) {
                e.target.seekTo(saved, true);
                setCurrent(saved);
              }
              resumedRef.current = true;
            } catch {}
          },
          onStateChange: (e: any) => {
            const YT = window.YT;
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.PLAYING) {
              setDuration(e.target.getDuration() || 0);
            }
          },
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

  // Time/subtitle loop
  useEffect(() => {
    let last = "";
    let lastSave = 0;
    const tick = () => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        try {
          const t = p.getCurrentTime();
          if (scrubbing === null) setCurrent(t);
          const d = p.getDuration?.() || 0;
          if (d && Math.abs(d - duration) > 0.5) setDuration(d);
          const frac = p.getVideoLoadedFraction?.() || 0;
          setBuffered(frac * (d || 0));
          // Persist progress every ~3s
          if (t > 5 && performance.now() - lastSave > 3000) {
            lastSave = performance.now();
            try { localStorage.setItem(progressKey, String(t)); } catch {}
          }
          if (captionsEnabled && cues.length) {
            const c = findCue(cues, t);
            const txt = c?.text ?? "";
            if (txt !== last) {
              last = txt;
              setCueText(txt);
            }
          } else if (last) {
            last = "";
            setCueText("");
          }
        } catch {}
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cues, captionsEnabled, scrubbing, duration]);

  // Save on unload
  useEffect(() => {
    const save = () => {
      try {
        const t = playerRef.current?.getCurrentTime?.();
        if (typeof t === "number" && t > 5) localStorage.setItem(progressKey, String(t));
      } catch {}
    };
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
    };
  }, [progressKey]);

  // Auto-hide UI
  const bump = () => {
    setShowUi(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playerRef.current && playerRef.current.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) {
        setShowUi(false);
      }
    }, 3000);
  };
  useEffect(() => {
    bump();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const playPause = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
    bump();
  };
  const seekBy = (delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(Math.max(0, Math.min(duration, p.getCurrentTime() + delta)), true);
    bump();
  };
  const seekTo = (t: number) => {
    playerRef.current?.seekTo(t, true);
  };
  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };
  const changeVolume = (v: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    setVolume(v);
    if (v > 0 && muted) {
      p.unMute();
      setMuted(false);
    }
  };
  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const onScrub = (clientX: number) => {
    const el = scrubRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = pct * duration;
    setScrubbing(t);
    return t;
  };
  const beginScrub = (e: React.PointerEvent) => {
    e.preventDefault();
    const startT = onScrub(e.clientX);
    seekTo(startT);
    const onMove = (ev: PointerEvent) => {
      const t = onScrub(ev.clientX);
      // Live-seek while dragging
      seekTo(t);
    };
    const onUp = (ev: PointerEvent) => {
      const t = onScrub(ev.clientX);
      seekTo(t);
      setCurrent(t);
      setScrubbing(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); playPause(); }
      else if (e.key === "ArrowRight") seekBy(10);
      else if (e.key === "ArrowLeft") seekBy(-10);
      else if (e.key.toLowerCase() === "f") goFullscreen();
      else if (e.key.toLowerCase() === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, muted]);

  const t = scrubbing ?? current;
  const pct = duration ? (t / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      onMouseMove={bump}
      onMouseLeave={() => playing && setShowUi(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border shadow-[var(--shadow-card)]"
    >
      {/* Scale iframe slightly bigger so YouTube's top title + bottom branding
          fall outside the visible area. */}
      <div
        ref={hostRef}
        title={title}
        className="absolute inset-0 size-full pointer-events-none origin-center"
        style={{ transform: "scale(1.08)" }}
      />
      {/* Click-catch overlay */}
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={playPause}
        onDoubleClick={goFullscreen}
        className="absolute inset-0 size-full cursor-pointer"
      />

      {/* Captions */}
      {captionsEnabled && cueText && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center px-6 transition-all duration-300"
          style={{ bottom: `${showUi ? captionStyle.position + 6 : captionStyle.position}%` }}
        >
          <div className="max-w-3xl text-center">
            <span
              className="inline-block whitespace-pre-line rounded-md px-3 py-1.5 font-medium leading-snug"
              style={captionCssStyle(captionStyle)}
            >
              {cueText}
            </span>
          </div>
        </div>
      )}

      {/* Apple TV-inspired overlay */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          showUi || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* gradients */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 to-transparent" />

        {/* Top bar — title */}
        <div className="pointer-events-auto absolute top-0 inset-x-0 flex items-center justify-between px-6 pt-5">
          <p className="text-[15px] font-semibold tracking-tight text-white/95 drop-shadow">{title}</p>
        </div>

        {/* Center play indicator when paused */}
        {!playing && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="grid place-items-center size-24 rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="pointer-events-auto absolute bottom-0 inset-x-0 px-6 pb-5">
          {/* Scrub bar */}
          <div
            ref={scrubRef}
            onPointerDown={beginScrub}
            className="group/scrub relative h-6 flex items-center cursor-pointer"
          >
            <div className={`relative w-full rounded-full bg-white/20 overflow-hidden transition-all ${scrubbing !== null ? "h-1.5" : "h-1"}`}>
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${pct}%` }} />
            </div>
            <div
              className={`absolute size-3.5 -ml-1.5 rounded-full bg-white shadow ring-1 ring-black/20 transition ${
                scrubbing !== null ? "opacity-100 scale-125" : "opacity-0 group-hover/scrub:opacity-100"
              }`}
              style={{ left: `${pct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-3 text-white">
            <button onClick={playPause} className="p-2 rounded-full hover:bg-white/10 transition" aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={() => seekBy(-10)} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Back 10 seconds">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
                <text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">10</text>
              </svg>
            </button>
            <button onClick={() => seekBy(10)} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Forward 10 seconds">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
                <text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">10</text>
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Mute">
                {muted || volume === 0 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12L19 9.5l-1.4-1.4L15.1 10.6 12.6 8.1 11.2 9.5 13.7 12l-2.5 2.5 1.4 1.4 2.5-2.5 2.5 2.5 1.4-1.4-2.5-2.5zM3 9v6h4l5 5V4L7 9H3z"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
                )}
              </button>
              <VolumeSlider value={muted ? 0 : volume} onChange={changeVolume} />
            </div>

            <div className="text-[12px] tabular-nums text-white/80 ml-1">
              {fmt(t)} <span className="text-white/40">/ {fmt(duration)}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <CaptionMenu
                appleTv
                enabled={captionsEnabled}
                onToggle={onToggleCaptions}
                onCues={onCues}
                currentLabel={captionLabel}
                hasCues={cues.length > 0}
                defaultQuery={defaultQuery}
                defaultSeason={defaultSeason}
                defaultEpisode={defaultEpisode}
                currentEpisodeId={videoId}
              />
              <button onClick={goFullscreen} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Fullscreen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const handle = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(pct * 100));
  };
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handle(e.clientX);
    const move = (ev: PointerEvent) => handle(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      ref={trackRef}
      onPointerDown={onDown}
      className="group/vol relative h-6 w-24 flex items-center cursor-pointer"
      aria-label="Volume"
    >
      <div className="relative h-1 w-full rounded-full bg-white/20 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${value}%` }} />
      </div>
      <div
        className="absolute size-3 -ml-1.5 rounded-full bg-white shadow ring-1 ring-black/20 opacity-0 group-hover/vol:opacity-100 transition"
        style={{ left: `${value}%` }}
      />
    </div>
  );
}
