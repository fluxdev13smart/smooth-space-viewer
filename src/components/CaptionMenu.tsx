import { useEffect, useRef, useState } from "react";
import { parseSubtitles, type Cue } from "@/lib/subtitles";

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onCues: (cues: Cue[], label: string) => void;
  currentLabel: string;
  hasCues: boolean;
  defaultQuery?: string;
  defaultSeason?: number;
  defaultEpisode?: number;
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
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    } catch (e: any) {
      setError(e.message || "Failed to load subtitle");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="relative">
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

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-[380px] max-h-[80vh] overflow-y-auto glass rounded-2xl p-4 shadow-[var(--shadow-card)]">
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
                Subtitles powered by OpenSubtitles.com
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
