import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { episodes, SERIES, SEASONS, episodesBySeason, thumb, thumbHQ } from "@/data/episodes";
import { RowScroller } from "@/components/RowScroller";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SERIES.title} — Lovable TV` },
      { name: "description", content: SERIES.tagline },
      { property: "og:title", content: `${SERIES.title} — Lovable TV` },
      { property: "og:description", content: SERIES.tagline },
      { property: "og:image", content: thumb(episodes[0].id) },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Hero />
      <main className="relative z-10 pb-32">
        <UpNext />
        {SEASONS.map((s) => (
          <EpisodesGrid key={s} season={s} />
        ))}
      </main>
      <Footer />
    </div>
  );
}

function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1500px] flex items-center justify-between px-8 h-12">
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 384 512" className="w-[18px] h-[18px] fill-foreground">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
          </svg>
          <span className="font-semibold tracking-tight text-sm">TV</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground font-medium">
          <a className="text-foreground">Watch Now</a>
          <a className="hover:text-foreground transition">Originals</a>
          <a className="hover:text-foreground transition">Movies</a>
          <a className="hover:text-foreground transition">TV Shows</a>
          <a className="hover:text-foreground transition">Library</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <div className="size-7 rounded-full bg-secondary grid place-items-center text-[11px] font-medium">O</div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const featured = episodes[0];
  return (
    <section className="relative h-[100vh] min-h-[680px] w-full overflow-hidden">
      <img
        src={thumb(featured.id)}
        onError={(e) => ((e.currentTarget as HTMLImageElement).src = thumbHQ(featured.id))}
        alt=""
        className="absolute inset-0 size-full object-cover scale-105"
      />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 70% 40%, transparent 0%, oklch(0.13 0.012 270 / 0.3) 50%, oklch(0.13 0.012 270) 100%)"
      }} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[image:var(--gradient-hero)]" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-[image:var(--gradient-hero-side)]" />

      <div className="relative z-10 h-full flex items-end">
        <div className="mx-auto max-w-[1500px] w-full px-8 pb-28 fade-in">
          <p className="text-[11px] uppercase tracking-[0.32em] text-foreground/70 mb-5 font-medium">
            A Lovable TV+ Original
          </p>

          {/* Show "logo" — large editorial title treatment */}
          <h1 className="text-[clamp(56px,9vw,148px)] font-bold tracking-[-0.04em] leading-[0.85] max-w-5xl">
            <span className="block text-gold">The Ottoman</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] md:text-base text-foreground/85 leading-relaxed">
            {SERIES.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/watch/$id"
              params={{ id: featured.id }}
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-foreground text-background font-semibold text-[14px] hover:scale-[1.03] transition-transform duration-300"
            >
              <PlayIcon /> Play
            </Link>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-foreground font-medium text-[14px] hover:bg-white/10 transition">
              <PlusIcon /> Up Next
            </button>
            <div className="ml-3 flex items-center gap-3 text-[13px] text-foreground/70">
              <span className="px-2 py-0.5 rounded border border-foreground/30 text-[10px] font-bold">TV-14</span>
              <span>{SEASONS.length} Seasons · {episodes.length} Episodes</span>
              <span>·</span>
              <span>Drama, History</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UpNext() {
  const [recents, setRecents] = useState<{ ep: typeof episodes[number]; progress: number }[]>([]);
  useEffect(() => {
    try {
      const list: { ep: typeof episodes[number]; progress: number; ts: number }[] = [];
      for (const ep of episodes) {
        const t = parseFloat(localStorage.getItem(`watch:progress:${ep.id}`) || "");
        const ts = parseFloat(localStorage.getItem(`watch:ts:${ep.id}`) || "0");
        if (isFinite(t) && t > 10) {
          const lenMin = ep.length ? parseInt(ep.length) : 50;
          const total = lenMin * 60;
          list.push({ ep, progress: Math.min(0.98, t / total), ts });
        }
      }
      list.sort((a, b) => b.ts - a.ts);
      setRecents(list.slice(0, 10).map(({ ep, progress }) => ({ ep, progress })));
    } catch {}
  }, []);
  if (recents.length === 0) return null;
  return (
    <Row title="Up Next" subtitle="Continue Watching">
      <RowScroller gap={20}>
        {recents.map(({ ep, progress }) => (
          <UpNextCard key={ep.id} ep={ep} progress={progress} />
        ))}
      </RowScroller>
    </Row>
  );
}

function UpNextCard({
  ep,
  progress,
}: {
  ep: (typeof episodes)[number];
  progress: number;
}) {
  const [src, setSrc] = useState(thumb(ep.id));
  return (
    <Link
      to="/watch/$id"
      params={{ id: ep.id }}
      className="group shrink-0 w-[420px] card-tilt"
    >
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-card ring-1 ring-border">
        <img
          src={src}
          onError={() => setSrc(thumbHQ(ep.id))}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/80">
            Episode {ep.episode}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {SERIES.title}
          </p>
          {progress > 0 ? (
            <div className="mt-3">
              <div className="h-[3px] rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-foreground/70">
                {Math.round((1 - progress) * 100)} min left
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-foreground/65">{ep.length}</p>
          )}
        </div>
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition duration-500 bg-black/20">
          <div className="size-14 rounded-full bg-white/95 text-black grid place-items-center backdrop-blur">
            <PlayIcon />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EpisodesGrid({ season }: { season: number }) {
  const items = episodesBySeason(season);
  return (
    <Row title={`Season ${season}`} subtitle={`${SERIES.title} · ${items.length} episodes`}>
      <RowScroller>
        {items.map((ep) => (
          <EpisodeCard key={ep.id} ep={ep} />
        ))}
      </RowScroller>
    </Row>
  );
}

function EpisodeCard({ ep }: { ep: (typeof episodes)[number] }) {
  const [src, setSrc] = useState(thumb(ep.id));
  return (
    <Link
      to="/watch/$id"
      params={{ id: ep.id }}
      className="group shrink-0 w-[280px] card-tilt"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card ring-1 ring-border">
        <img
          src={src}
          onError={() => setSrc(thumbHQ(ep.id))}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
        <span className="absolute top-2.5 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/55 backdrop-blur text-white">
          E{ep.episode}
        </span>
        {ep.length && (
          <span className="absolute bottom-2.5 right-3 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/55 backdrop-blur text-white">
            {ep.length}
          </span>
        )}
      </div>
      <div className="pt-3 px-0.5">
        <p className="text-[13px] font-medium tracking-tight">
          Episode {ep.episode}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          S{ep.season} · {SERIES.title}
        </p>
      </div>
    </Link>
  );
}

function Row({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1500px] px-8 pt-14">
      <div className="flex items-end justify-between mb-5">
        <div>
          {subtitle && (
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
              {subtitle}
            </p>
          )}
          <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <button className="text-[13px] text-muted-foreground hover:text-foreground transition">
          See All →
        </button>
      </div>
      {children}
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 text-center">
      <p className="text-[11px] text-muted-foreground">
        Lovable TV+ · Streaming for the rest of us
      </p>
    </footer>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
