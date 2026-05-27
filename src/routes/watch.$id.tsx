import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { episodes, thumb, thumbHQ, SERIES, episodesBySeason } from "@/data/episodes";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { RowScroller } from "@/components/RowScroller";
import type { Cue } from "@/lib/subtitles";

export const Route = createFileRoute("/watch/$id")({
  head: ({ params }) => {
    const ep = episodes.find((e) => e.id === params.id);
    if (!ep) return { meta: [{ title: "Watch — Lovable TV" }] };
    return {
      meta: [
        { title: `${SERIES.title} · E${ep.episode} — Lovable TV` },
        { name: "description", content: `Watch ${SERIES.title} Episode ${ep.episode}.` },
        { property: "og:title", content: `${SERIES.title} · Episode ${ep.episode}` },
        { property: "og:description", content: SERIES.tagline },
        { property: "og:image", content: thumb(ep.id) },
      ],
    };
  },
  loader: ({ params }) => {
    const ep = episodes.find((e) => e.id === params.id);
    if (!ep) throw notFound();
    return { ep };
  },
  component: Watch,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Episode not found.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back to library
        </Link>
      </div>
    </div>
  ),
});

function Watch() {
  const { ep } = Route.useLoaderData();
  const [captions, setCaptions] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);
  const [cueLabel, setCueLabel] = useState("No subtitles loaded");

  const seasonEpisodes = episodesBySeason(ep.season);
  const idx = seasonEpisodes.findIndex((e) => e.id === ep.id);
  const next = seasonEpisodes[idx + 1];
  const prev = seasonEpisodes[idx - 1];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-0 inset-x-0 z-50 glass">
        <div className="mx-auto max-w-[1500px] flex items-center justify-between px-8 h-12">
          <Link to="/" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition">
            <span className="text-base">‹</span> Library
          </Link>
          <p className="text-[13px] font-medium tracking-tight hidden md:block">
            {SERIES.title} · Episode {ep.episode}
          </p>
          <div className="w-20" />
        </div>
      </div>

      <main className="pt-12">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8 pt-8">
          <YouTubePlayer
            videoId={ep.id}
            cues={cues}
            captionsEnabled={captions}
            title={`${SERIES.title} · S${ep.season} · E${ep.episode}`}
            onToggleCaptions={setCaptions}
            onCues={(c, label) => {
              setCues(c);
              setCueLabel(label);
            }}
            captionLabel={cueLabel}
            defaultQuery={SERIES.subtitle || SERIES.title}
            defaultSeason={ep.season}
            defaultEpisode={ep.episode}
          />

          <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-medium">
                Season {ep.season} · Episode {ep.episode}
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                {SERIES.title}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {SERIES.subtitle}{ep.length ? ` · ${ep.length}` : ""} · TV-14
              </p>
              <p className="mt-5 text-[15px] text-foreground/80 leading-relaxed">
                {SERIES.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {prev && (
                <Link
                  to="/watch/$id"
                  params={{ id: prev.id }}
                  className="px-4 py-2 rounded-full glass text-sm hover:bg-white/10 transition"
                >
                  ‹ E{prev.episode}
                </Link>
              )}
              {next && (
                <Link
                  to="/watch/$id"
                  params={{ id: next.id }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-[1.03] transition-transform"
                >
                  Next Episode ›
                </Link>
              )}
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-[1500px] px-8 mt-16 pb-32">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                Season {ep.season}
              </p>
              <h2 className="text-[22px] font-semibold tracking-tight">
                More Episodes
              </h2>
            </div>
          </div>
          <RowScroller>
            {seasonEpisodes
              .filter((e) => e.id !== ep.id)
              .map((e) => (
                <UpNextCard key={e.id} ep={e} />
              ))}
          </RowScroller>
        </section>
      </main>
    </div>
  );
}

function UpNextCard({ ep }: { ep: (typeof episodes)[number] }) {
  const [src, setSrc] = useState(thumb(ep.id));
  return (
    <Link
      to="/watch/$id"
      params={{ id: ep.id }}
      className="group shrink-0 w-[280px] card-tilt"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-border bg-card">
        <img
          src={src}
          onError={() => setSrc(thumbHQ(ep.id))}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <span className="absolute top-2.5 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/55 backdrop-blur text-white">
          E{ep.episode}
        </span>
        {ep.length && (
          <span className="absolute bottom-2.5 right-3 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/55 backdrop-blur text-white">
            {ep.length}
          </span>
        )}
      </div>
      <p className="mt-3 text-[13px] font-medium tracking-tight px-0.5">
        Episode {ep.episode}
      </p>
      <p className="text-[12px] text-muted-foreground mt-0.5 px-0.5">
        {SERIES.title}
      </p>
    </Link>
  );
}
