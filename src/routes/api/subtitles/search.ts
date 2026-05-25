import { createFileRoute } from "@tanstack/react-router";

const UA = "SmoothWatchSpace v1.0.0";

export const Route = createFileRoute("/api/subtitles/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env.OPENSUBTITLES_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OPENSUBTITLES_API_KEY not configured" }, { status: 500 });
        }
        const url = new URL(request.url);
        const query = url.searchParams.get("query")?.trim();
        const languages = url.searchParams.get("languages") || "en";
        const season = url.searchParams.get("season");
        const episode = url.searchParams.get("episode");
        if (!query) {
          return Response.json({ error: "Missing query" }, { status: 400 });
        }

        const params = new URLSearchParams();
        params.set("query", query);
        params.set("languages", languages);
        if (season) params.set("season_number", season);
        if (episode) params.set("episode_number", episode);

        const res = await fetch(
          `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`,
          {
            headers: {
              "Api-Key": apiKey,
              "User-Agent": UA,
              Accept: "application/json",
            },
          },
        );
        const text = await res.text();
        if (!res.ok) {
          return new Response(text, {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const json = JSON.parse(text);
        // Slim payload
        const results = (json.data || []).slice(0, 25).map((d: any) => {
          const a = d.attributes || {};
          const files = a.files || [];
          return {
            id: d.id,
            release: a.release,
            language: a.language,
            download_count: a.download_count,
            from_trusted: a.from_trusted,
            ratings: a.ratings,
            feature_title: a.feature_details?.title,
            year: a.feature_details?.year,
            file_id: files[0]?.file_id,
            file_name: files[0]?.file_name,
          };
        });
        return Response.json({ results });
      },
    },
  },
});