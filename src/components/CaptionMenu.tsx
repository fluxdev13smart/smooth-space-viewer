import { useRef, useState } from "react";
import { parseSubtitles, type Cue } from "@/lib/subtitles";

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onCues: (cues: Cue[], label: string) => void;
  currentLabel: string;
  hasCues: boolean;
}

export function CaptionMenu({
  enabled,
  onToggle,
  onCues,
  currentLabel,
  hasCues,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const cues = parseSubtitles(text);
      if (!cues.length) throw new Error("No cues found in file");
      onCues(cues, file.name);
      onToggle(true);
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to parse subtitle file");
    }
  }

  async function handleUrl() {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const cues = parseSubtitles(text);
      if (!cues.length) throw new Error("No cues found");
      onCues(cues, new URL(url).pathname.split("/").pop() || "Subtitles");
      onToggle(true);
      setOpen(false);
      setUrl("");
    } catch (e: any) {
      setError(
        e.message?.includes("Failed to fetch")
          ? "Couldn't fetch (CORS-blocked or invalid URL). Try uploading instead."
          : e.message || "Failed to load subtitles",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => (hasCues ? onToggle(!enabled) : setOpen(true))}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        aria-pressed={enabled}
        title="Subtitles & captions (right-click for options)"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
          enabled && hasCues
            ? "bg-primary text-primary-foreground"
            : "glass text-foreground hover:bg-secondary/80"
        }`}
      >
        <span className="inline-grid place-items-center text-[10px] font-bold border-2 border-current rounded px-1.5 leading-tight">
          CC
        </span>
        <span className="hidden sm:inline">
          {hasCues ? (enabled ? "On" : "Off") : "Subtitles"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="ml-1 opacity-70 hover:opacity-100"
        >
          ▾
        </button>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-[340px] glass rounded-2xl p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Subtitles
            </p>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  onCues([], "Off");
                  onToggle(false);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  !enabled ? "bg-foreground/10" : "hover:bg-foreground/5"
                }`}
              >
                Off
              </button>
              {hasCues && (
                <div
                  className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    enabled ? "bg-primary/15 text-primary" : ""
                  }`}
                >
                  <span className="truncate">{currentLabel}</span>
                  <button
                    onClick={() => {
                      onToggle(!enabled);
                      setOpen(false);
                    }}
                    className="text-xs underline opacity-80"
                  >
                    {enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Load from file (.srt / .vtt)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".srt,.vtt,text/vtt,application/x-subrip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
                >
                  Choose subtitle file
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">
                  Or paste subtitle URL
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…/subtitles.srt"
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    disabled={loading || !url}
                    onClick={handleUrl}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "…" : "Load"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tip: download a .srt from OpenSubtitles and upload here, or
                paste a direct file URL.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
