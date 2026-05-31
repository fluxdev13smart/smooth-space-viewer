import { useEffect, useRef, useState } from "react";
import { parseSubtitles, type Cue } from "@/lib/subtitles";
import { useServerFn } from "@tanstack/react-start";
import { getSharedSubtitles, saveSharedSubtitle } from "@/lib/sharedSubtitles.functions";
import { useCaptionStyle } from "@/lib/captionStyle";

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onCues: (cues: Cue[], label: string) => void;
  currentLabel: string;
  hasCues: boolean;
  defaultQuery?: string;
  defaultSeason?: number;
  defaultEpisode?: number;
  appleTv?: boolean;
  parentImdbId?: string;
  currentEpisodeId?: string;
}

interface SearchResult {
  id: string;
  release?: string;
  language?: string;
  download_count?: number;
  from_trusted?: boolean;
  ratings?: number;
  feature_title?: string;
  year?: number;
  file_id?: number;
  file_name?: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ur", label: "Urdu" },
  { code: "hi", label: "Hindi" },
  { code: "id", label: "Indonesian" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
];

export function CaptionMenu({
  enabled,
  onToggle,
  onCues,
  currentLabel,
  hasCues,
  defaultQuery = "",
  defaultSeason,
  defaultEpisode,
  appleTv = false,
  parentImdbId = "9018736",
  currentEpisodeId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"subs" | "browse" | "style">("subs");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [sharedItems, setSharedItems] = useState<
    { id: string; label: string; content: string; language: string; created_at: string }[]
  >([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const fetchShared = useServerFn(getSharedSubtitles);
  const saveShared = useServerFn(saveSharedSubtitle);
  const autoLoadedRef = useRef<string | null>(null);

  const [query, setQuery] = useState(defaultQuery);
  const [season, setSeason] = useState<string>(defaultSeason ? String(defaultSeason) : "");
  const [episode, setEpisode] = useState<string>(defaultEpisode ? String(defaultEpisode) : "");
  const [language, setLanguage] = useState("en");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setQuery(defaultQuery);
    setSeason(defaultSeason ? String(defaultSeason) : "");
    setEpisode(defaultEpisode ? String(defaultEpisode) : "");
    setResults(null);
  }, [defaultQuery, defaultSeason, defaultEpisode]);

  // Load shared subtitles for this video + auto-apply the latest one once
  useEffect(() => {
    if (!currentEpisodeId) return;
    let cancelled = false;
    setSharedLoading(true);
    fetchShared({ data: { videoId: currentEpisodeId } })
      .then((r) => {
        if (cancelled) return;
        setSharedItems(r.items as any);
        const latest = r.items?.[0];
        if (latest && autoLoadedRef.current !== currentEpisodeId) {
          try {
            const cues = parseSubtitles(latest.content);
            if (cues.length) {
              onCues(cues, latest.label);
              onToggle(true);
              autoLoadedRef.current = currentEpisodeId;
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setSharedLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisodeId]);

  async function persistShared(label: string, content: string, sourceUrl?: string, language?: string) {
    if (!currentEpisodeId) return;
    try {
      await saveShared({
        data: {
          videoId: currentEpisodeId,
          label: label.slice(0, 500),
          content,
          sourceUrl,
          language,
        },
      });
      const r = await fetchShared({ data: { videoId: currentEpisodeId } });
      setSharedItems(r.items as any);
    } catch {
      // best-effort; don't surface to the user
    }
  }

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const cues = parseSubtitles(text);
      if (!cues.length) throw new Error("No cues found in file");
      onCues(cues, file.name);
      onToggle(true);
      setOpen(false);
      persistShared(file.name, text);
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
      const label = new URL(url).pathname.split("/").pop() || "Subtitles";
      onCues(cues, label);
      onToggle(true);
      setOpen(false);
      persistShared(label, text, url);
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

  async function handleSearch() {
    if (!query.trim()) {
      setError("Enter a title to search");
      return;
    }
    setSearching(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ query: query.trim(), languages: language });
      if (parentImdbId) params.set("parent_imdb_id", parentImdbId);
      if (season) params.set("season", season);
      if (episode) params.set("episode", episode);
      const res = await fetch(`/api/subtitles/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Search failed (${res.status})`);
      setResults(data.results || []);
      if (!data.results?.length) setError("No subtitles found. Try a different title or language.");
    } catch (e: any) {
      setError(e.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(r: SearchResult) {
    if (!r.file_id) {
      setError("This result has no downloadable file");
      return;
    }
    setDownloadingId(r.id);
    setError(null);
    try {
      const res = await fetch("/api/subtitles/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: r.file_id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Download failed (${res.status})`);
      }
      const text = await res.text();
      const cues = parseSubtitles(text);
      if (!cues.length) throw new Error("Subtitle file had no cues");
      const label = r.release || r.file_name || `${r.feature_title ?? "Subtitles"} (${r.language})`;
      onCues(cues, label);
      onToggle(true);
      setOpen(false);
      persistShared(label, text, undefined, r.language);
    } catch (e: any) {
      setError(e.message || "Failed to load subtitle");
    } finally {
      setDownloadingId(null);
    }
  }

  function pickShared(item: { label: string; content: string }) {
    try {
      const cues = parseSubtitles(item.content);
      if (!cues.length) throw new Error("No cues found");
      onCues(cues, item.label);
      onToggle(true);
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to load subtitle");
    }
  }

  return (
    <div className="relative">
      {appleTv ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Subtitles"
          title="Subtitles"
          className={`px-2.5 py-1.5 rounded-md transition flex items-center gap-1.5 text-[11px] font-bold tracking-wider ${
            enabled && hasCues
              ? "bg-white text-black ring-1 ring-white"
              : "bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/30"
          }`}
        >
          <span>CC</span>
        </button>
      ) : (
      <div
        className={`inline-flex items-center rounded-full text-sm font-medium transition ${
          enabled && hasCues
            ? "bg-primary text-primary-foreground"
            : "glass text-foreground hover:bg-secondary/80"
        }`}
      >
        <button
          type="button"
          onClick={() => (hasCues ? onToggle(!enabled) : setOpen(true))}
          onContextMenu={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          aria-pressed={enabled}
          title="Subtitles & captions (right-click for options)"
          className="inline-flex items-center gap-2 pl-4 pr-2 py-2"
        >
          <span className="inline-grid place-items-center text-[10px] font-bold border-2 border-current rounded px-1.5 leading-tight">
            CC
          </span>
          <span className="hidden sm:inline">
            {hasCues ? (enabled ? "On" : "Off") : "Subtitles"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pr-3 pl-1 py-2 opacity-70 hover:opacity-100"
          aria-label="Subtitle options"
        >
          ▾
        </button>
      </div>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute z-50 w-[380px] max-h-[70vh] overflow-y-auto glass rounded-2xl p-4 shadow-[var(--shadow-card)] ${appleTv ? "right-0 bottom-full mb-2" : "right-0 top-full mt-2"}`}>
            <div className="flex gap-1 mb-3 p-1 rounded-full bg-white/5">
              <button
                onClick={() => setTab("subs")}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-full transition ${
                  tab === "subs" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                Subtitles
              </button>
              <button
                onClick={() => setTab("style")}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-full transition ${
                  tab === "style" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                Style
              </button>
              <button
                onClick={() => setTab("browse")}
                className={`flex-1 text-[11px] font-medium py-1.5 rounded-full transition ${
                  tab === "browse" ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                Browse
              </button>
            </div>

            {tab === "browse" ? (
              <OpenSubtitlesBrowser />
            ) : tab === "style" ? (
              <StylePanelImpl />
            ) : (
              <SubsPanel />
            )}
          </div>
        </>
      )}
    </div>
  );

  function SubsPanel() {
    return (
      <>
        {sharedItems.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              Shared by viewers ({sharedItems.length})
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {sharedItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => pickShared(it)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition"
                >
                  <p className="text-xs font-medium truncate">{it.label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {it.language}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
        {sharedLoading && sharedItems.length === 0 && (
          <p className="text-[10px] text-muted-foreground mb-2">Checking shared subtitles…</p>
        )}
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
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Search OpenSubtitles
              </p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title (e.g. Kuruluş Osman)"
                className="w-full px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value.replace(/\D/g, ""))}
                  placeholder="Season"
                  className="w-20 px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Episode"
                  className="w-24 px-3 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {searching ? "Searching…" : "Search"}
              </button>

              {results && results.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1.5 -mx-1 px-1">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handlePick(r)}
                      disabled={downloadingId === r.id || !r.file_id}
                      className="w-full text-left px-3 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition disabled:opacity-50"
                    >
                      <p className="text-xs font-medium truncate">
                        {r.release || r.file_name || "Untitled"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                        <span className="uppercase">{r.language}</span>
                        {typeof r.download_count === "number" && (
                          <span>↓ {r.download_count.toLocaleString()}</span>
                        )}
                        {r.from_trusted && <span className="text-primary">✓ trusted</span>}
                        {downloadingId === r.id && <span>loading…</span>}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 mt-3 space-y-3">
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
                Subtitles you upload or link are saved so other viewers automatically get them.
              </p>
            </div>
      </>
    );
  }
}

function OpenSubtitlesBrowser() {
  return <_OpenSubtitlesBrowser />;
}

function StylePanelImpl() {
  const [style, update, reset] = useCaptionStyle();
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3">
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
  return (
    <div className="space-y-3 text-white">
      <div
        className="rounded-lg p-3 text-center"
        style={{
          background:
            "linear-gradient(135deg,#1a1a2e,#0f0f1f)",
        }}
      >
        <span
          className="inline-block px-3 py-1.5 rounded-md font-medium"
          style={{
            background: `rgba(0,0,0,${style.bgOpacity})`,
            color: style.textColor,
            fontFamily: style.fontFamily,
            fontSize: Math.max(14, style.fontSize),
            textShadow:
              style.edgeStyle === "shadow"
                ? "0 2px 6px rgba(0,0,0,0.9)"
                : style.edgeStyle === "outline"
                ? "-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000"
                : undefined,
          }}
        >
          Preview caption text
        </span>
      </div>
      <Row label={`Font size · ${style.fontSize}`}>
        <input
          type="range" min={12} max={48} step={1}
          value={style.fontSize}
          onChange={(e) => update({ fontSize: +e.target.value })}
          className="w-40 accent-white"
        />
      </Row>
      <Row label="Font">
        <select
          value={style.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="bg-secondary text-xs px-2 py-1 rounded"
        >
          <option value="system-ui">System</option>
          <option value="'Helvetica Neue', Arial, sans-serif">Sans</option>
          <option value="Georgia, 'Times New Roman', serif">Serif</option>
          <option value="'Courier New', monospace">Mono</option>
        </select>
      </Row>
      <Row label="Text color">
        <input
          type="color"
          value={style.textColor}
          onChange={(e) => update({ textColor: e.target.value })}
          className="w-10 h-7 bg-transparent rounded cursor-pointer"
        />
      </Row>
      <Row label={`Background · ${Math.round(style.bgOpacity * 100)}%`}>
        <input
          type="range" min={0} max={1} step={0.05}
          value={style.bgOpacity}
          onChange={(e) => update({ bgOpacity: +e.target.value })}
          className="w-40 accent-white"
        />
      </Row>
      <Row label="Edge style">
        <select
          value={style.edgeStyle}
          onChange={(e) => update({ edgeStyle: e.target.value as any })}
          className="bg-secondary text-xs px-2 py-1 rounded"
        >
          <option value="none">None</option>
          <option value="shadow">Shadow</option>
          <option value="outline">Outline</option>
        </select>
      </Row>
      <Row label={`Position · ${style.position}%`}>
        <input
          type="range" min={5} max={40} step={1}
          value={style.position}
          onChange={(e) => update({ position: +e.target.value })}
          className="w-40 accent-white"
        />
      </Row>
      <button
        onClick={() => reset()}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function _OpenSubtitlesBrowser() {
  const SHOW_URL = "https://www.opensubtitles.com/en/tvshows/2019-kurulus-osman";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          OpenSubtitles · Kuruluş Osman
        </p>
      </div>
      <div className="rounded-xl bg-white/5 p-4 text-xs text-white/75 space-y-3">
        <p className="leading-relaxed">
          OpenSubtitles refuses to load inside other sites. Open it in a new
          tab, download an <code>.srt</code> / <code>.vtt</code> file, then
          drop it back here from the <strong>Subtitles</strong> tab —
          everyone watching this episode will get it automatically.
        </p>
        <a
          href={SHOW_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-3 py-2 rounded-lg bg-white text-black font-medium"
        >
          Open OpenSubtitles ↗
        </a>
      </div>
    </div>
  );
}
