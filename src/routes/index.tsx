import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { episodes, SERIES, SEASONS, episodesBySeason, thumb, thumbHQ } from "@/data/episodes";

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
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
            <path d="M19.1 14.5c-.4 1-.9 1.9-1.5 2.7-.8 1.1-1.5 1.9-2.1 2.4-1 .8-2 1.2-3 1.2-.7 0-1.6-.2-2.6-.6-1-.4-2-.6-2.8-.6-.9 0-1.8.2-2.8.6-1 .4-1.9.6-2.5.6-1 0-2.1-.4-3.1-1.3C-.5 18.7-1.3 17.8-2 16.7-2.8 15.4-3.5 14-4 12.3c-.5-1.8-.8-3.5-.8-5.2 0-1.9.4-3.5 1.2-4.9.6-1.1 1.5-2 2.5-2.6 1.1-.7 2.2-1 3.4-1 .7 0 1.7.2 2.9.7 1.2.4 2 .7 2.3.7.2 0 1.1-.3 2.6-.8 1.4-.5 2.7-.7 3.7-.6 2.7.2 4.8 1.3 6.2 3.3-2.4 1.5-3.6 3.5-3.6 6.2 0 2.1.8 3.8 2.3 5.2.7.6 1.5 1.1 2.4 1.5-.2.6-.4 1.1-.6 1.7z" transform="translate(4 2)"/>
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
  const items = episodes.slice(0, 8);
  return (
    <Row title="Up Next" subtitle="Continue Watching">
      <div className="row-scroll flex gap-5 overflow-x-auto pb-6 -mx-8 px-8">
        {items.map((ep, i) => (
          <UpNextCard key={ep.id} ep={ep} progress={i === 0 ? 0.42 : i === 1 ? 0.18 : 0} />
        ))}
      </div>
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
      <div className="row-scroll flex gap-4 overflow-x-auto pb-6 -mx-8 px-8">
        {items.map((ep) => (
          <EpisodeCard key={ep.id} ep={ep} />
        ))}
      </div>
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
